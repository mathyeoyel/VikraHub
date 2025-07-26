# backend/messaging/chat_consumer.py
import json
import logging
from uuid import UUID
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.conf import settings
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from jwt import decode as jwt_decode
from .models import Conversation, Message, ConversationParticipant

# Set up logging
logger = logging.getLogger(__name__)


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time direct messaging
    Handles: {type: "message", recipient_id: X, text: "..."}
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user_group_name = None
        self.user = None
    
    @database_sync_to_async
    def authenticate_token(self, token):
        """Authenticate user by JWT token"""
        try:
            # Validate the token
            UntypedToken(token)
            
            # Decode the token to get user info
            decoded_token = jwt_decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = decoded_token.get('user_id')
            
            if user_id:
                user = User.objects.get(id=user_id)
                return user
        except (InvalidToken, TokenError, User.DoesNotExist) as e:
            logger.warning(f"Token authentication failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during token authentication: {e}")
            return None
        
        return None
        
    async def connect(self):
        """Accept WebSocket connection for authenticated users only"""
        try:
            logger.info("=== ChatConsumer.connect() called ===")
            
            # Check for JWT token in query parameters
            query_string = self.scope.get('query_string', b'').decode()
            token = None
            if 'token=' in query_string:
                token = query_string.split('token=')[1].split('&')[0]
            
            if not token:
                logger.warning("ChatConsumer: No JWT token provided, rejecting connection")
                await self.close(code=4001)
                return
            
            # Authenticate user
            self.user = await self.authenticate_token(token)
            if not self.user:
                logger.warning("ChatConsumer: Authentication failed, rejecting connection")
                await self.close(code=4001)
                return
            
            # Accept connection
            await self.accept()
            
            # Join user-specific group for receiving messages
            self.user_group_name = f"chat_{self.user.id}"
            await self.channel_layer.group_add(
                self.user_group_name,
                self.channel_name
            )
            
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
        """Handle direct message: {type: "message", recipient_id: X, text: "..."}"""
        try:
            recipient_id = data.get('recipient_id')
            text = data.get('text', '').strip()
            
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
            
            # Create or get conversation
            conversation = await self.get_or_create_conversation(self.user, recipient)
            
            # Create message
            message = await self.create_message(conversation, self.user, recipient, text)
            
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
            }
            
            # Send to recipient via their channel group
            await self.channel_layer.group_send(
                f"chat_{recipient.id}",
                {
                    'type': 'new_message',
                    'message': message_data
                }
            )
            
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
    def get_or_create_conversation(self, user1, user2):
        """Get or create conversation between two users"""
        try:
            # Try to find existing conversation between these users
            conversation = Conversation.objects.filter(
                participants=user1,
                is_deleted=False
            ).filter(
                participants=user2
            ).filter(
                participants__count=2  # Ensure it's exactly 2 participants
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
    def create_message(self, conversation, sender, recipient, content):
        """Create a new message"""
        try:
            message = Message.objects.create(
                conversation=conversation,
                sender=sender,
                recipient=recipient,
                content=content
            )
            
            # Update conversation timestamp
            conversation.save()
            
            return message
            
        except Exception as e:
            logger.exception(f"Error creating message: {e}")
            raise
