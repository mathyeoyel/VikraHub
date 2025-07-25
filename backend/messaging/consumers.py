# backend/messaging/consumers.py
import json
import logging
import os
from uuid import UUID
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.conf import settings
from .models import Conversation, Message, TypingStatus

# Set up logging
logger = logging.getLogger(__name__)


class MessagingConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time messaging
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.group_name = None
        self.user_group_name = None
        
    async def connect(self):
        """Accept WebSocket connection and join user group"""
        try:
            logger.info("=== MessagingConsumer.connect() called ===")
            
            # Check if channel layer is configured
            if not hasattr(settings, 'CHANNEL_LAYERS') or not settings.CHANNEL_LAYERS:
                logger.error("CHANNEL_LAYERS not configured in settings")
                await self.close(code=1011)
                return
                
            # Check if Redis URL is available for production
            redis_url = os.environ.get('REDIS_URL')
            if not redis_url and not settings.DEBUG:
                logger.warning("REDIS_URL environment variable not set for production deployment")
            
            self.user = self.scope.get("user")
            logger.info(f"MessagingConsumer: self.user = {self.user}")
            logger.info(f"MessagingConsumer: User type = {type(self.user)}")
            logger.info(f"MessagingConsumer: Is anonymous = {self.user.is_anonymous if hasattr(self.user, 'is_anonymous') else 'No is_anonymous attr'}")
            
            # Log the entire scope for debugging
            scope_info = {
                'type': self.scope.get('type'),
                'path': self.scope.get('path'),
                'query_string': self.scope.get('query_string', b'').decode(),
                'user': str(self.scope.get('user')),
                'client': self.scope.get('client'),
                'server': self.scope.get('server'),
            }
            logger.info(f"MessagingConsumer: Full scope info = {scope_info}")
            
            # Accept connection first
            await self.accept()
            logger.info("MessagingConsumer: Connection accepted")
            
            # Only set up user group if user is authenticated
            if self.user and not self.user.is_anonymous:
                # Join user-specific group for notifications
                self.user_group_name = f"user_{self.user.id}"
                self.group_name = self.user_group_name  # Set group_name for disconnect
                logger.info(f"MessagingConsumer: Joining user group: {self.user_group_name}")
                
                await self.channel_layer.group_add(
                    self.user_group_name,
                    self.channel_name
                )
                
                # Send connection confirmation
                await self.send(text_data=json.dumps({
                    'type': 'connection_established',
                    'user_id': self.user.id,
                    'username': self.user.username
                }))
                logger.info(f"MessagingConsumer: Connection established for user {self.user.username}")
            else:
                # Send anonymous connection confirmation
                await self.send(text_data=json.dumps({
                    'type': 'connection_established',
                    'user_id': None,
                    'username': 'anonymous',
                    'message': 'Connected as anonymous user'
                }))
                logger.info("MessagingConsumer: Connection established for anonymous user")
            
            logger.info("=== MessagingConsumer.connect() completed ===")
            
        except Exception as exc:
            logger.exception('Error during WebSocket connect: %s', exc)
            await self.close(code=1011)
    
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        try:
            logger.info(f"MessagingConsumer: Disconnecting with close_code: {close_code}")
            
            # Remove from user group if it was set
            if hasattr(self, 'group_name') and self.group_name:
                await self.channel_layer.group_discard(
                    self.group_name,
                    self.channel_name
                )
                logger.info(f"MessagingConsumer: Left group: {self.group_name}")
            
            # Remove from user-specific group if it was set
            if hasattr(self, 'user_group_name') and self.user_group_name:
                await self.channel_layer.group_discard(
                    self.user_group_name,
                    self.channel_name
                )
                logger.info(f"MessagingConsumer: Left user group: {self.user_group_name}")
            
            # Clear typing status if user is authenticated
            if hasattr(self, 'user') and self.user and not self.user.is_anonymous:
                await self.clear_typing_status()
                logger.info("MessagingConsumer: Cleared typing status")
                
        except Exception as exc:
            logger.exception('Error during WebSocket disconnect: %s', exc)
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            logger.debug(f"MessagingConsumer: Received message type: {message_type}")
            
            if message_type == 'join_conversation':
                await self.join_conversation(data)
            elif message_type == 'leave_conversation':
                await self.leave_conversation(data)
            elif message_type == 'typing_start':
                await self.handle_typing_start(data)
            elif message_type == 'typing_stop':
                await self.handle_typing_stop(data)
            elif message_type == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': f'Unknown message type: {message_type}'
                }))
                
        except (json.JSONDecodeError, KeyError) as e:
            logger.exception(f"Error parsing WebSocket message: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid message format'
            }))
        except Exception as exc:
            logger.exception(f"Unexpected error in receive: {exc}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'An unexpected error occurred'
            }))
    
    async def join_conversation(self, data):
        """Join a conversation room"""
        try:
            # Check if user is authenticated
            if not self.user or self.user.is_anonymous:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Authentication required to join conversations'
                }))
                return
                
            conversation_id = data.get('conversation_id')
            if not conversation_id:
                raise ValidationError("Conversation ID is required")
            
            # Validate conversation access
            has_access = await self.check_conversation_access(conversation_id)
            if not has_access:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Access denied to this conversation'
                }))
                return
            
            # Join conversation group
            conversation_group = f"conversation_{conversation_id}"
            await self.channel_layer.group_add(
                conversation_group,
                self.channel_name
            )
            
            await self.send(text_data=json.dumps({
                'type': 'conversation_joined',
                'conversation_id': conversation_id
            }))
            
        except Exception as e:
            logger.exception(f"Error joining conversation: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Failed to join conversation: {str(e)}'
            }))
    
    async def leave_conversation(self, data):
        """Leave a conversation room"""
        try:
            # Check if user is authenticated
            if not self.user or self.user.is_anonymous:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Authentication required'
                }))
                return
                
            conversation_id = data.get('conversation_id')
            if not conversation_id:
                raise ValidationError("Conversation ID is required")
            
            # Leave conversation group
            conversation_group = f"conversation_{conversation_id}"
            await self.channel_layer.group_discard(
                conversation_group,
                self.channel_name
            )
            
            # Clear typing status for this conversation
            await self.clear_typing_status_for_conversation(conversation_id)
            
            await self.send(text_data=json.dumps({
                'type': 'conversation_left',
                'conversation_id': conversation_id
            }))
            
        except Exception as e:
            logger.exception(f"Error leaving conversation: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Failed to leave conversation: {str(e)}'
            }))
    
    async def handle_typing_start(self, data):
        """Handle typing start notification"""
        try:
            # Check if user is authenticated
            if not self.user or self.user.is_anonymous:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Authentication required'
                }))
                return
                
            conversation_id = data.get('conversation_id')
            if not conversation_id:
                raise ValidationError("Conversation ID is required")
            
            # Validate conversation access
            has_access = await self.check_conversation_access(conversation_id)
            if not has_access:
                return
            
            # Update typing status
            await self.set_typing_status(conversation_id, True)
            
            # Notify other participants
            conversation_group = f"conversation_{conversation_id}"
            await self.channel_layer.group_send(
                conversation_group,
                {
                    'type': 'user_typing',
                    'conversation_id': conversation_id,
                    'user': {
                        'id': self.user.id,
                        'username': self.user.username,
                        'full_name': f"{self.user.first_name} {self.user.last_name}".strip() or self.user.username
                    },
                    'is_typing': True
                }
            )
            
        except Exception as e:
            logger.exception(f"Error handling typing start: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Failed to update typing status: {str(e)}'
            }))
    
    async def handle_typing_stop(self, data):
        """Handle typing stop notification"""
        try:
            # Check if user is authenticated
            if not self.user or self.user.is_anonymous:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Authentication required'
                }))
                return
                
            conversation_id = data.get('conversation_id')
            if not conversation_id:
                raise ValidationError("Conversation ID is required")
            
            # Validate conversation access
            has_access = await self.check_conversation_access(conversation_id)
            if not has_access:
                return
            
            # Clear typing status
            await self.set_typing_status(conversation_id, False)
            
            # Notify other participants
            conversation_group = f"conversation_{conversation_id}"
            await self.channel_layer.group_send(
                conversation_group,
                {
                    'type': 'user_typing',
                    'conversation_id': conversation_id,
                    'user': {
                        'id': self.user.id,
                        'username': self.user.username,
                        'full_name': f"{self.user.first_name} {self.user.last_name}".strip() or self.user.username
                    },
                    'is_typing': False
                }
            )
            
        except Exception as e:
            logger.exception(f"Error handling typing stop: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Failed to update typing status: {str(e)}'
            }))
    
    # Group message handlers (called by group_send)
    async def new_message(self, event):
        """Send new message notification to client"""
        try:
            await self.send(text_data=json.dumps({
                'type': 'new_message',
                'message': event['message']
            }))
        except Exception as e:
            logger.exception(f"Error sending new message notification: {e}")
    
    async def message_updated(self, event):
        """Send message update notification to client"""
        try:
            await self.send(text_data=json.dumps({
                'type': 'message_updated',
                'message': event['message']
            }))
        except Exception as e:
            logger.exception(f"Error sending message update notification: {e}")
    
    async def message_deleted(self, event):
        """Send message deletion notification to client"""
        try:
            await self.send(text_data=json.dumps({
                'type': 'message_deleted',
                'message_id': event['message_id'],
                'conversation_id': event['conversation_id']
            }))
        except Exception as e:
            logger.exception(f"Error sending message deletion notification: {e}")
    
    async def user_typing(self, event):
        """Send typing notification to client (don't send to self)"""
        try:
            if hasattr(self, 'user') and self.user and event['user']['id'] != self.user.id:
                await self.send(text_data=json.dumps({
                    'type': 'user_typing',
                    'conversation_id': event['conversation_id'],
                    'user': event['user'],
                    'is_typing': event['is_typing']
                }))
        except Exception as e:
            logger.exception(f"Error sending typing notification: {e}")
    
    async def conversation_updated(self, event):
        """Send conversation update notification to client"""
        try:
            await self.send(text_data=json.dumps({
                'type': 'conversation_updated',
                'conversation': event['conversation']
            }))
        except Exception as e:
            logger.exception(f"Error sending conversation update notification: {e}")
    
    async def follow_notification(self, event):
        """Send follow notification to client"""
        try:
            await self.send(text_data=json.dumps({
                'type': 'follow_notification',
                'notification': event['notification']
            }))
        except Exception as e:
            logger.exception(f"Error sending follow notification: {e}")
    
    # Database operations
    @database_sync_to_async
    def check_conversation_access(self, conversation_id):
        """Check if user has access to conversation"""
        try:
            if not self.user or self.user.is_anonymous:
                return False
                
            conversation = Conversation.objects.get(
                id=UUID(conversation_id),
                participants=self.user,
                is_deleted=False
            )
            return not conversation.deleted_by.filter(id=self.user.id).exists()
        except (Conversation.DoesNotExist, ValidationError) as e:
            logger.warning(f"Conversation access check failed: {e}")
            return False
        except Exception as e:
            logger.exception(f"Unexpected error in conversation access check: {e}")
            return False
    
    @database_sync_to_async
    def set_typing_status(self, conversation_id, is_typing):
        """Set typing status for user in conversation"""
        try:
            if not self.user or self.user.is_anonymous:
                return
                
            conversation = Conversation.objects.get(
                id=UUID(conversation_id),
                participants=self.user,
                is_deleted=False
            )
            
            if is_typing:
                typing_status, created = TypingStatus.objects.get_or_create(
                    user=self.user,
                    conversation=conversation,
                    defaults={'is_typing': True}
                )
                if not created:
                    typing_status.is_typing = True
                    typing_status.save()
            else:
                TypingStatus.objects.filter(
                    user=self.user,
                    conversation=conversation
                ).delete()
                
        except (Conversation.DoesNotExist, ValidationError) as e:
            logger.warning(f"Setting typing status failed: {e}")
        except Exception as e:
            logger.exception(f"Unexpected error setting typing status: {e}")
    
    @database_sync_to_async
    def clear_typing_status(self):
        """Clear all typing status for this user"""
        try:
            if self.user and not self.user.is_anonymous:
                TypingStatus.objects.filter(user=self.user).delete()
        except Exception as e:
            logger.exception(f"Error clearing typing status: {e}")
    
    @database_sync_to_async
    def clear_typing_status_for_conversation(self, conversation_id):
        """Clear typing status for specific conversation"""
        try:
            if not self.user or self.user.is_anonymous:
                return
                
            conversation = Conversation.objects.get(
                id=UUID(conversation_id),
                participants=self.user,
                is_deleted=False
            )
            TypingStatus.objects.filter(
                user=self.user,
                conversation=conversation
            ).delete()
        except (Conversation.DoesNotExist, ValidationError) as e:
            logger.warning(f"Clearing conversation typing status failed: {e}")
        except Exception as e:
            logger.exception(f"Unexpected error clearing conversation typing status: {e}")
