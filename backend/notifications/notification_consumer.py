# backend/notifications/notification_consumer.py
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from django.utils import timezone

logger = logging.getLogger(__name__)


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time notifications
    
    Each user connects to their own notification channel: notifications_{user.id}
    This consumer mainly receives notifications from the backend and sends them to the frontend.
    It can also handle mark-as-read events from the frontend.
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user_group_name = None
        self.user = None
    
    async def connect(self):
        """Accept WebSocket connection for authenticated users only"""
        try:
            logger.info("=== NotificationConsumer.connect() called ===")
            
            # Get authenticated user from middleware
            self.user = self.scope.get('user')
            
            # Check if user is authenticated
            if not self.user or self.user.is_anonymous:
                logger.warning("NotificationConsumer: No authenticated user, rejecting connection")
                await self.close(code=4001)
                return
            
            # Set up user group for notifications
            self.user_group_name = f"notifications_{self.user.id}"
            
            # Join user's notification group
            await self.channel_layer.group_add(
                self.user_group_name,
                self.channel_name
            )
            
            # Accept the connection
            await self.accept()
            
            # Update user's online status
            await self.update_user_status("online")
            
            # Send initial unread count
            await self.send_unread_count()
            
            logger.info(f"✅ User {self.user.username} connected to notifications WebSocket")
            
        except Exception as e:
            logger.error(f"❌ NotificationConsumer connection error: {e}")
            await self.close(code=4000)
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        try:
            logger.info(f"=== NotificationConsumer.disconnect() called with code {close_code} ===")
            
            if self.user and self.user_group_name:
                # Leave user group
                await self.channel_layer.group_discard(
                    self.user_group_name,
                    self.channel_name
                )
                
                # Update user's offline status
                await self.update_user_status("offline")
                
                logger.info(f"📤 User {self.user.username} disconnected from notifications WebSocket")
            
        except Exception as e:
            logger.error(f"❌ NotificationConsumer disconnect error: {e}")
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages from frontend"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            logger.debug(f"📥 NotificationConsumer received: {data}")
            
            if message_type == 'mark_notification_read':
                await self.handle_mark_notification_read(data)
            elif message_type == 'mark_all_notifications_read':
                await self.handle_mark_all_notifications_read()
            elif message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': timezone.now().isoformat()
                }))
            else:
                logger.warning(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON received: {e}")
        except Exception as e:
            logger.error(f"Error handling message: {e}")
    
    async def handle_mark_notification_read(self, data):
        """Handle marking a specific notification as read"""
        try:
            notification_id = data.get('notification_id')
            if not notification_id:
                return
            
            # Mark notification as read in database
            success = await self.mark_notification_read(notification_id)
            
            if success:
                # Send updated unread count
                await self.send_unread_count()
                
                # Confirm to frontend
                await self.send(text_data=json.dumps({
                    'type': 'notification_marked_read',
                    'notification_id': notification_id,
                    'timestamp': timezone.now().isoformat()
                }))
            
        except Exception as e:
            logger.error(f"Error marking notification as read: {e}")
    
    async def handle_mark_all_notifications_read(self):
        """Handle marking all notifications as read"""
        try:
            # Mark all notifications as read in database
            updated_count = await self.mark_all_notifications_read()
            
            # Send updated unread count
            await self.send_unread_count()
            
            # Confirm to frontend
            await self.send(text_data=json.dumps({
                'type': 'all_notifications_marked_read',
                'updated_count': updated_count,
                'timestamp': timezone.now().isoformat()
            }))
            
        except Exception as e:
            logger.error(f"Error marking all notifications as read: {e}")
    
    # Channel layer message handlers (called from backend)
    
    async def new_notification(self, event):
        """Handle new notification broadcast from backend"""
        try:
            await self.send(text_data=json.dumps({
                'type': 'new_notification',
                'notification': event['notification'],
                'timestamp': event['timestamp']
            }))
            
        except Exception as e:
            logger.error(f"Error sending new notification: {e}")
    
    async def unread_count_update(self, event):
        """Handle unread count update from backend"""
        try:
            await self.send(text_data=json.dumps({
                'type': 'unread_count_update',
                'notification_count': event.get('notification_count', 0),
                'message_count': event.get('message_count', 0),
                'timestamp': event['timestamp']
            }))
            
        except Exception as e:
            logger.error(f"Error sending unread count update: {e}")
    
    # Database operations
    
    @database_sync_to_async
    def update_user_status(self, status):
        """Update user's online status"""
        try:
            # Try to update user status if UserStatus model exists
            from messaging.models import UserStatus
            user_status, created = UserStatus.objects.get_or_create(user=self.user)
            user_status.status = status
            user_status.last_seen = timezone.now()
            user_status.save()
            
        except ImportError:
            # UserStatus model doesn't exist, skip
            pass
        except Exception as e:
            logger.warning(f"Failed to update user status: {e}")
    
    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        """Mark a specific notification as read"""
        try:
            from core.models import Notification
            
            notification = Notification.objects.filter(
                id=notification_id,
                user=self.user
            ).first()
            
            if notification and not notification.is_read:
                notification.mark_as_read()
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Database error marking notification as read: {e}")
            return False
    
    @database_sync_to_async
    def mark_all_notifications_read(self):
        """Mark all user's notifications as read"""
        try:
            from core.models import Notification
            
            updated_count = Notification.objects.filter(
                user=self.user,
                is_read=False
            ).update(is_read=True)
            
            return updated_count
            
        except Exception as e:
            logger.error(f"Database error marking all notifications as read: {e}")
            return 0
    
    @database_sync_to_async
    def get_unread_count(self):
        """Get current unread notification count"""
        try:
            from core.models import Notification
            
            return Notification.objects.filter(
                user=self.user,
                is_read=False
            ).count()
            
        except Exception as e:
            logger.error(f"Database error getting unread count: {e}")
            return 0
    
    async def send_unread_count(self):
        """Send current unread count to frontend"""
        try:
            count = await self.get_unread_count()
            
            await self.send(text_data=json.dumps({
                'type': 'unread_count',
                'count': count,
                'timestamp': timezone.now().isoformat()
            }))
            
        except Exception as e:
            logger.error(f"Error sending unread count: {e}")
