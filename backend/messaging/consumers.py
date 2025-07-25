# backend/messaging/consumers.py
import json
import logging
from uuid import UUID
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from .models import Conversation, Message, TypingStatus

# Set up logging
logger = logging.getLogger(__name__)


class MessagingConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time messaging
    """
    
    async def connect(self):
        """Accept WebSocket connection and join user group"""
        logger.info("=== MessagingConsumer.connect() called ===")
        
        self.user = self.scope["user"]
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
        
        # Temporarily accept even anonymous users for debugging
        # if self.user.is_anonymous:
        #     logger.warning("MessagingConsumer: Rejecting anonymous user")
        #     await self.close()
        #     return
        
        logger.info("MessagingConsumer: Accepting connection (anonymous users temporarily allowed)")
        await self.accept()
        
        # Only set up user group if user is authenticated
        if not self.user.is_anonymous:
            # Join user-specific group for notifications
            self.user_group_name = f"user_{self.user.id}"
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
                'message': 'Connected as anonymous user (debug mode)'
            }))
            logger.info("MessagingConsumer: Connection established for anonymous user (debug mode)")
        
        logger.info("=== MessagingConsumer.connect() completed ===")
    
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if hasattr(self, 'user_group_name'):
            # Leave user group
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )
            
            # Clear typing status
            await self.clear_typing_status()
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
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
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid message format'
            }))
    
    async def join_conversation(self, data):
        """Join a conversation room"""
        try:
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
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': str(e)
            }))
    
    async def leave_conversation(self, data):
        """Leave a conversation room"""
        try:
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
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': str(e)
            }))
    
    async def handle_typing_start(self, data):
        """Handle typing start notification"""
        try:
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
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': str(e)
            }))
    
    async def handle_typing_stop(self, data):
        """Handle typing stop notification"""
        try:
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
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': str(e)
            }))
    
    # Group message handlers (called by group_send)
    async def new_message(self, event):
        """Send new message notification to client"""
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': event['message']
        }))
    
    async def message_updated(self, event):
        """Send message update notification to client"""
        await self.send(text_data=json.dumps({
            'type': 'message_updated',
            'message': event['message']
        }))
    
    async def message_deleted(self, event):
        """Send message deletion notification to client"""
        await self.send(text_data=json.dumps({
            'type': 'message_deleted',
            'message_id': event['message_id'],
            'conversation_id': event['conversation_id']
        }))
    
    async def user_typing(self, event):
        """Send typing notification to client (don't send to self)"""
        if event['user']['id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'user_typing',
                'conversation_id': event['conversation_id'],
                'user': event['user'],
                'is_typing': event['is_typing']
            }))
    
    async def conversation_updated(self, event):
        """Send conversation update notification to client"""
        await self.send(text_data=json.dumps({
            'type': 'conversation_updated',
            'conversation': event['conversation']
        }))
    
    async def follow_notification(self, event):
        """Send follow notification to client"""
        await self.send(text_data=json.dumps({
            'type': 'follow_notification',
            'notification': event['notification']
        }))
    
    # Database operations
    @database_sync_to_async
    def check_conversation_access(self, conversation_id):
        """Check if user has access to conversation"""
        try:
            conversation = Conversation.objects.get(
                id=UUID(conversation_id),
                participants=self.user,
                is_deleted=False
            )
            return not conversation.deleted_by.filter(id=self.user.id).exists()
        except (Conversation.DoesNotExist, ValidationError):
            return False
    
    @database_sync_to_async
    def set_typing_status(self, conversation_id, is_typing):
        """Set typing status for user in conversation"""
        try:
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
                
        except (Conversation.DoesNotExist, ValidationError):
            pass
    
    @database_sync_to_async
    def clear_typing_status(self):
        """Clear all typing status for this user"""
        TypingStatus.objects.filter(user=self.user).delete()
    
    @database_sync_to_async
    def clear_typing_status_for_conversation(self, conversation_id):
        """Clear typing status for specific conversation"""
        try:
            conversation = Conversation.objects.get(
                id=UUID(conversation_id),
                participants=self.user,
                is_deleted=False
            )
            TypingStatus.objects.filter(
                user=self.user,
                conversation=conversation
            ).delete()
        except (Conversation.DoesNotExist, ValidationError):
            pass
