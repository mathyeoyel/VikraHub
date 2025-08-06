# backend/messaging/chat_consumer.py
import json
import logging
from uuid import UUID
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from asgiref.sync import sync_to_async
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.conf import settings
from django.db.models import Count
from django.utils import timezone
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from jwt import decode as jwt_decode
from .models import (
    Conversation, Message, ConversationParticipant, 
    MessageReaction, UserStatus
)

# Set up logging
logger = logging.getLogger(__name__)


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time direct messaging
    Handles: {type: "message", recipient_id: X, text: "..."}
    
    Authentication is handled by JWTAuthMiddleware in ASGI.
    User is available via self.scope['user']
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user_group_name = None
        self.user = None
        
    async def connect(self):
        """Accept WebSocket connection for authenticated users only"""
        try:
            logger.info("=== ChatConsumer.connect() called ===")
            
            # Get authenticated user from middleware
            self.user = self.scope.get('user')
            
            # Check if user is authenticated
            if not self.user or self.user.is_anonymous:
                logger.warning("ChatConsumer: No authenticated user, rejecting connection")
                await self.close(code=4001)
                return
            
            # Accept connection
            await self.accept()
            
            # Set user as online and update last active
            await self.set_user_online(True)
            
            # Join user-specific group for receiving messages
            self.user_group_name = f"chat_{self.user.id}"
            await self.channel_layer.group_add(
                self.user_group_name,
                self.channel_name
            )
            
            # Broadcast user status to conversations
            await self.broadcast_user_status()
            
            # Send connection confirmation
            await self.send(text_data=json.dumps({
                'type': 'connection_established',
                'user_id': self.user.id,
                'username': self.user.username,
                'message': 'Connected to chat system'
            }))
            
            logger.info(f"ChatConsumer: Connection established for user {self.user.username}")
            
        except Exception as exc:
            logger.exception(f'Error during ChatConsumer connect: {exc}')
            await self.close(code=1011)
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        try:
            logger.info(f"ChatConsumer: Disconnecting with close_code: {close_code}")
            
            # Set user as offline and update last active
            if self.user:
                await self.set_user_online(False)
                await self.broadcast_user_status()
            
            # Leave user group
            if self.user_group_name:
                await self.channel_layer.group_discard(
                    self.user_group_name,
                    self.channel_name
                )
                logger.info(f"ChatConsumer: Left group: {self.user_group_name}")
                
        except Exception as exc:
            logger.exception(f'Error during ChatConsumer disconnect: {exc}')
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            logger.debug(f"ChatConsumer: Received message type: {message_type}")
            
            if message_type == 'message':
                await self.handle_direct_message(data)
            elif message_type == 'mark_read':
                await self.handle_mark_read(data)
            elif message_type in ['react', 'add_reaction', 'remove_reaction']:
                await self.handle_reaction(data)
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
    
    async def handle_direct_message(self, data):
        """Handle direct message: {type: "message", recipient_id: X, text: "...", reply_to_id?: Y}"""
        try:
            recipient_id = data.get('recipient_id')
            text = data.get('text', '').strip()
            reply_to_id = data.get('reply_to_id')
            
            if not recipient_id or not text:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'recipient_id and text are required'
                }))
                return
            
            # Validate recipient exists
            recipient = await self.get_user_by_id(recipient_id)
            if not recipient:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Recipient not found'
                }))
                return
            
            if recipient.id == self.user.id:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Cannot send message to yourself'
                }))
                return
            
            # Validate reply_to message if provided
            reply_to_message = None
            if reply_to_id:
                reply_to_message = await self.get_message_by_id(reply_to_id)
                if not reply_to_message:
                    await self.send(text_data=json.dumps({
                        'type': 'error',
                        'message': 'Reply message not found'
                    }))
                    return
            
            # Create or get conversation
            conversation = await self.get_or_create_conversation(self.user, recipient)
            
            # Create message
            message = await self.create_message(conversation, self.user, recipient, text, reply_to_message)
            
            # Create notification for the recipient (separate from message creation to avoid async issues)
            try:
                # Pre-compute full names to avoid database queries in sync method
                sender_full_name = f"{self.user.first_name} {self.user.last_name}".strip()
                
                if reply_to_message:
                    # If this is a reply, notify the original sender
                    original_sender_full_name = f"{reply_to_message.sender.first_name} {reply_to_message.sender.last_name}".strip()
                    await self.create_message_notification_sync(
                        self.user, reply_to_message.sender, text, sender_full_name, 
                        is_reply=True, original_sender=reply_to_message.sender, 
                        original_sender_full_name=original_sender_full_name
                    )
                else:
                    # Regular message notification
                    await self.create_message_notification_sync(self.user, recipient, text, sender_full_name)
            except Exception as e:
                logger.warning(f"Failed to create message notification: {e}")
            
            # Mark as delivered to recipient
            await self.mark_message_delivered(message, recipient)
            
            # Get reactions and reply_to data
            reactions = await self.get_message_reactions(message)
            reply_to_data = None
            if message.reply_to:
                reply_to_data = await self.get_reply_to_data(message.reply_to)
            
            # Prepare message data
            message_data = {
                'id': str(message.id),
                'conversation_id': str(conversation.id),
                'sender': {
                    'id': self.user.id,
                    'username': self.user.username,
                    'full_name': f"{self.user.first_name} {self.user.last_name}".strip() or self.user.username
                },
                'recipient': {
                    'id': recipient.id,
                    'username': recipient.username,
                    'full_name': f"{recipient.first_name} {recipient.last_name}".strip() or recipient.username
                },
                'text': text,
                'timestamp': message.created_at.isoformat(),
                'reply_to': reply_to_data,
                'reactions': reactions,
            }
            
            # Send to recipient via their channel group
            await self.channel_layer.group_send(
                f"chat_{recipient.id}",
                {
                    'type': 'new_message',
                    'message': message_data
                }
            )
            
            # Send delivery receipt to sender
            await self.send(text_data=json.dumps({
                'type': 'message_delivered',
                'message_id': str(message.id),
                'delivered_to': recipient.username,
                'delivered_at': timezone.now().isoformat()
            }))
            
            # Send confirmation to sender
            await self.send(text_data=json.dumps({
                'type': 'message_sent',
                'message': message_data
            }))
            
            logger.info(f"ChatConsumer: Message sent from {self.user.username} to {recipient.username}")
            
        except Exception as e:
            logger.exception(f"Error handling direct message: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Failed to send message: {str(e)}'
            }))
    
    async def handle_mark_read(self, data):
        """Handle mark read: {type: "mark_read", message_id: X}"""
        try:
            message_id = data.get('message_id')
            if not message_id:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'message_id is required'
                }))
                return
            
            # Get message
            message = await self.get_message_by_id(message_id)
            if not message:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Message not found'
                }))
                return
            
            # Mark as read
            await self.mark_message_read(message, self.user)
            
            # Send read receipt to sender
            if message.sender.id != self.user.id:
                await self.channel_layer.group_send(
                    f"chat_{message.sender.id}",
                    {
                        'type': 'message_read_event',
                        'message_id': str(message.id),
                        'read_by': self.user.username,
                        'read_at': timezone.now().isoformat()
                    }
                )
            
            await self.send(text_data=json.dumps({
                'type': 'mark_read_success',
                'message_id': str(message.id)
            }))
            
        except Exception as e:
            logger.exception(f"Error marking message as read: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Failed to mark message as read: {str(e)}'
            }))
    
    async def handle_reaction(self, data):
        """Handle reaction: {type: "add_reaction/remove_reaction/react", message_id: X, reaction_type: Y}"""
        try:
            message_id = data.get('message_id')
            # Support both 'reaction' and 'reaction_type' for backward compatibility
            reaction = data.get('reaction') or data.get('reaction_type')
            message_type = data.get('type', 'react')
            
            if not message_id or not reaction:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'message_id and reaction/reaction_type are required'
                }))
                return
            
            # Get message
            message = await self.get_message_by_id(message_id)
            if not message:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Message not found'
                }))
                return
            
            # Handle different message types
            if message_type == 'remove_reaction':
                # Remove reaction
                reaction_added = await self.remove_message_reaction(message, self.user)
            elif message_type in ['add_reaction', 'react']:
                # Add or toggle reaction
                reaction_added = await self.toggle_message_reaction(message, self.user, reaction)
                
                # Create notification for reaction if it was added (not removed)
                if reaction_added and self.user != message.sender:
                    try:
                        # Pre-compute full name to avoid database queries in sync method
                        reactor_full_name = f"{self.user.first_name} {self.user.last_name}".strip()
                        await self.create_reaction_notification_sync(self.user, message.sender, reaction, reactor_full_name)
                    except Exception as e:
                        logger.warning(f"Failed to create reaction notification: {e}")
            else:
                # Default to toggle for backward compatibility
                reaction_added = await self.toggle_message_reaction(message, self.user, reaction)
                
                # Create notification for reaction if it was added (not removed)
                if reaction_added and self.user != message.sender:
                    try:
                        # Pre-compute full name to avoid database queries in sync method
                        reactor_full_name = f"{self.user.first_name} {self.user.last_name}".strip()
                        await self.create_reaction_notification_sync(self.user, message.sender, reaction, reactor_full_name)
                    except Exception as e:
                        logger.warning(f"Failed to create reaction notification: {e}")
            
            # Get updated reactions
            reactions = await self.get_message_reactions(message)
            
            # Get conversation participants
            participants = await self.get_conversation_participants(message.conversation)
            
            # Broadcast reaction update to all participants
            for participant in participants:
                await self.channel_layer.group_send(
                    f"chat_{participant.id}",
                    {
                        'type': 'reaction_update',
                        'message_id': str(message.id),
                        'reactions': reactions,
                        'user': self.user.username,
                        'reaction': reaction,
                        'added': reaction_added
                    }
                )
            
        except Exception as e:
            logger.exception(f"Error handling reaction: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Failed to process reaction: {str(e)}'
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
    
    async def message_read_event(self, event):
        """Send message read notification to client"""
        try:
            await self.send(text_data=json.dumps({
                'type': 'message_read',
                'message_id': event['message_id'],
                'read_by': event['read_by'],
                'read_at': event['read_at']
            }))
        except Exception as e:
            logger.exception(f"Error sending message read notification: {e}")
    
    async def reaction_update(self, event):
        """Send reaction update to client"""
        try:
            await self.send(text_data=json.dumps({
                'type': 'reaction_update',
                'message_id': event['message_id'],
                'reactions': event['reactions'],
                'user': event['user'],
                'reaction': event['reaction'],
                'added': event['added']
            }))
        except Exception as e:
            logger.exception(f"Error sending reaction update: {e}")
    
    async def user_status_update(self, event):
        """Send user status update to client"""
        try:
            await self.send(text_data=json.dumps({
                'type': 'user_status',
                'user_id': event['user_id'],
                'username': event['username'],
                'is_online': event['is_online'],
                'last_active': event.get('last_active')
            }))
        except Exception as e:
            logger.exception(f"Error sending user status update: {e}")
    
    # Database operations
    @database_sync_to_async
    def get_user_by_id(self, user_id):
        """Get user by ID"""
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None
        except Exception as e:
            logger.exception(f"Error getting user by ID: {e}")
            return None
    
    @database_sync_to_async
    def get_message_by_id(self, message_id):
        """Get message by ID"""
        try:
            return Message.objects.get(id=message_id)
        except Message.DoesNotExist:
            return None
        except Exception as e:
            logger.exception(f"Error getting message by ID: {e}")
            return None
    
    @database_sync_to_async
    def set_user_online(self, is_online):
        """Set user online status"""
        try:
            user_status, created = UserStatus.objects.get_or_create(
                user=self.user,
                defaults={'is_online': is_online}
            )
            if not created:
                user_status.is_online = is_online
                user_status.save()
            return user_status
        except Exception as e:
            logger.exception(f"Error setting user online status: {e}")
            return None
    
    @database_sync_to_async
    def get_conversation_participants(self, conversation):
        """Get conversation participants"""
        try:
            return list(conversation.participants.all())
        except Exception as e:
            logger.exception(f"Error getting conversation participants: {e}")
            return []
    
    @database_sync_to_async
    def get_user_conversations(self):
        """Get user's conversations for broadcasting status"""
        try:
            conversations = Conversation.objects.filter(
                participants=self.user,
                is_deleted=False
            ).exclude(deleted_by=self.user)
            
            participants = set()
            for conv in conversations:
                for participant in conv.participants.exclude(id=self.user.id):
                    participants.add(participant)
            
            return list(participants)
        except Exception as e:
            logger.exception(f"Error getting user conversations: {e}")
            return []
    
    @database_sync_to_async
    def mark_message_delivered(self, message, user):
        """Mark message as delivered"""
        try:
            message.mark_as_delivered(user)
        except Exception as e:
            logger.exception(f"Error marking message as delivered: {e}")
    
    @database_sync_to_async
    def mark_message_read(self, message, user):
        """Mark message as read"""
        try:
            message.mark_as_read(user)
        except Exception as e:
            logger.exception(f"Error marking message as read: {e}")
    
    @database_sync_to_async
    def toggle_message_reaction(self, message, user, reaction):
        """Add or remove message reaction and send notification"""
        try:
            existing_reaction = MessageReaction.objects.filter(
                message=message,
                user=user,
                reaction=reaction
            ).first()
            
            if existing_reaction:
                existing_reaction.delete()
                return False  # Reaction removed
            else:
                MessageReaction.objects.create(
                    message=message,
                    user=user,
                    reaction=reaction
                )
                
                return True  # Reaction added
        except Exception as e:
            logger.exception(f"Error toggling message reaction: {e}")
            return False
    
    @database_sync_to_async
    def remove_message_reaction(self, message, user):
        """Remove user's reaction from message"""
        try:
            deleted_count, _ = MessageReaction.objects.filter(
                message=message,
                user=user
            ).delete()
            
            return deleted_count > 0  # True if reaction was removed
        except Exception as e:
            logger.exception(f"Error removing message reaction: {e}")
            return False
    
    @database_sync_to_async
    def get_message_reactions(self, message):
        """Get message reactions in the format expected by frontend"""
        try:
            reactions = MessageReaction.objects.filter(message=message).select_related('user')
            return [
                {
                    'user': {
                        'id': reaction.user.id,
                        'username': reaction.user.username
                    },
                    'reaction_type': reaction.reaction,
                    'created_at': reaction.created_at.isoformat()
                }
                for reaction in reactions
            ]
        except Exception as e:
            logger.exception(f"Error getting message reactions: {e}")
            return []
    
    @database_sync_to_async
    def get_reply_to_data(self, reply_message):
        """Get reply-to message data"""
        try:
            return {
                'id': str(reply_message.id),
                'content': reply_message.content[:100] + ('...' if len(reply_message.content) > 100 else ''),
                'sender': {
                    'id': reply_message.sender.id,
                    'username': reply_message.sender.username
                }
            }
        except Exception as e:
            logger.exception(f"Error getting reply-to data: {e}")
            return None
    
    async def broadcast_user_status(self):
        """Broadcast user status to all conversation participants"""
        try:
            participants = await self.get_user_conversations()
            user_status = await self.set_user_online(True) if hasattr(self, 'user') else None
            
            if user_status:
                for participant in participants:
                    await self.channel_layer.group_send(
                        f"chat_{participant.id}",
                        {
                            'type': 'user_status_update',
                            'user_id': self.user.id,
                            'username': self.user.username,
                            'is_online': user_status.is_online,
                            'last_active': user_status.last_active.isoformat()
                        }
                    )
        except Exception as e:
            logger.exception(f"Error broadcasting user status: {e}")
    
    @database_sync_to_async
    def get_or_create_conversation(self, user1, user2):
        """Get or create conversation between two users"""
        try:
            # Try to find existing conversation between these users
            conversation = Conversation.objects.filter(
                participants=user1,
                is_deleted=False
            ).filter(
                participants=user2
            ).annotate(
                participant_count=Count('participants')
            ).filter(
                participant_count=2  # Ensure it's exactly 2 participants
            ).first()
            
            if conversation:
                # Check if conversation is not deleted by either user
                if not conversation.deleted_by.filter(id__in=[user1.id, user2.id]).exists():
                    return conversation
            
            # Create new conversation
            conversation = Conversation.objects.create()
            
            # Add participants
            ConversationParticipant.objects.create(
                conversation=conversation,
                user=user1
            )
            ConversationParticipant.objects.create(
                conversation=conversation,
                user=user2
            )
            
            logger.info(f"Created new conversation between {user1.username} and {user2.username}")
            return conversation
            
        except Exception as e:
            logger.exception(f"Error getting/creating conversation: {e}")
            raise
    
    @database_sync_to_async
    def create_message(self, conversation, sender, recipient, content, reply_to=None):
        """Create a new message"""
        try:
            message = Message.objects.create(
                conversation=conversation,
                sender=sender,
                recipient=recipient,
                content=content,
                reply_to=reply_to
            )
            
            # Update conversation timestamp
            conversation.save()
            
            return message
            
        except Exception as e:
            logger.exception(f"Error creating message: {e}")
            raise
    
    @database_sync_to_async
    def create_message_notification_sync(self, sender, recipient, content, sender_full_name, is_reply=False, original_sender=None, original_sender_full_name=None):
        """Create message notification synchronously"""
        try:
            from core.models import Notification
            
            if is_reply and original_sender:
                # If this is a reply, create reply notification directly
                if sender == original_sender:
                    return  # Don't notify self
                
                preview = content[:100] + "..." if len(content) > 100 else content
                
                notification = Notification.objects.create(
                    user=original_sender,
                    verb="reply",
                    actor=sender,
                    payload={
                        "preview": preview,
                        "message_length": len(content)
                    },
                    message=f"{sender_full_name or sender.username} replied to your message"
                )
            else:
                # Regular message notification
                if sender == recipient:
                    return  # Don't notify self
                
                preview = content[:100] + "..." if len(content) > 100 else content
                
                notification = Notification.objects.create(
                    user=recipient,
                    verb="message",
                    actor=sender,
                    payload={
                        "preview": preview,
                        "message_length": len(content)
                    },
                    message=f"{sender_full_name or sender.username} sent you a message"
                )
                
        except Exception as e:
            logger.warning(f"Failed to create message notification: {e}")
    
    @database_sync_to_async
    def create_reaction_notification_sync(self, reactor, message_owner, reaction_type, reactor_full_name):
        """Create reaction notification synchronously"""
        try:
            from core.models import Notification
            
            # Create notification using the pre-computed full name
            notification = Notification.objects.create(
                user=message_owner,
                verb="reaction",
                actor=reactor,
                payload={
                    "reaction_type": reaction_type,
                    "reactor_username": reactor.username
                },
                message=f"{reactor_full_name or reactor.username} reacted {reaction_type} to your message"
            )
            
            logger.debug(f"Created reaction notification for {message_owner.username}")
            return notification
            
        except Exception as e:
            logger.exception(f"Error creating reaction notification: {e}")
            return None
