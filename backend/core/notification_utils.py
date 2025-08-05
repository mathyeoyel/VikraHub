# backend/core/notification_utils.py
import logging
import json
from typing import Dict, Any, Optional, List
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Notification, Device

logger = logging.getLogger(__name__)


def create_notification(
    user: User,
    verb: str,
    actor: Optional[User] = None,
    target: Optional[Any] = None,
    payload: Optional[Dict] = None,
    message: str = ""
) -> Notification:
    """
    Create a notification and broadcast it via WebSocket
    
    Args:
        user: Recipient of the notification
        verb: Action type (message, follow, like, etc.)
        actor: User who triggered the notification
        target: Target object (message, post, etc.)
        payload: Additional data as dict
        message: Legacy message field
    
    Returns:
        Created Notification instance
    """
    notification_data = {
        'user': user,
        'verb': verb,
        'actor': actor,
        'payload': payload or {},
        'message': message
    }
    
    # Add generic foreign key fields if target is provided
    if target:
        notification_data['target_content_type'] = ContentType.objects.get_for_model(target)
        notification_data['target_object_id'] = target.pk
    
    # Create the notification
    notification = Notification.objects.create(**notification_data)
    
    # Broadcast via WebSocket
    broadcast_notification(notification)
    
    # Send push notification
    send_push_notifications(notification)
    
    logger.info(f"Created notification: {notification}")
    return notification


def broadcast_notification(notification: Notification):
    """
    Broadcast notification to user's WebSocket group
    """
    try:
        channel_layer = get_channel_layer()
        if not channel_layer:
            logger.warning("No channel layer configured")
            return
        
        # Serialize notification data
        from .serializers import NotificationSerializer
        notification_data = NotificationSerializer(notification).data
        
        # Send to user's notification group
        async_to_sync(channel_layer.group_send)(
            f"notifications_{notification.user.id}",
            {
                'type': 'new_notification',
                'notification': notification_data,
                'timestamp': timezone.now().isoformat()
            }
        )
        
        logger.debug(f"Broadcasted notification {notification.id} to user {notification.user.id}")
        
    except Exception as e:
        logger.error(f"Failed to broadcast notification {notification.id}: {e}")


def send_push_notifications(notification: Notification):
    """
    Send push notifications to all user's active devices
    """
    try:
        devices = Device.objects.filter(
            user=notification.user,
            is_active=True
        )
        
        if not devices.exists():
            logger.debug(f"No active devices for user {notification.user.id}")
            return
        
        # Prepare push notification data
        title = notification.title
        body = notification.payload.get('preview', notification.message)
        
        # Additional data for the push notification
        push_data = {
            'notification_id': str(notification.id),
            'verb': notification.verb,
            'actor_id': str(notification.actor.id) if notification.actor else None,
            'created_at': notification.created_at.isoformat()
        }
        
        # Send to each device
        for device in devices:
            try:
                send_push_notification(device, title, body, push_data)
            except Exception as e:
                logger.warning(f"Failed to send push to device {device.id}: {e}")
                
    except Exception as e:
        logger.error(f"Failed to send push notifications for notification {notification.id}: {e}")


def send_push_notification(
    device: Device,
    title: str,
    body: str,
    data: Optional[Dict] = None
):
    """
    Send push notification to a specific device
    
    Args:
        device: Device instance
        title: Notification title
        body: Notification body
        data: Additional data payload
    """
    if device.platform == 'web':
        send_web_push(device, title, body, data)
    elif device.platform in ['ios', 'android']:
        send_fcm_push(device, title, body, data)
    else:
        logger.warning(f"Unknown platform: {device.platform}")


def send_web_push(device: Device, title: str, body: str, data: Optional[Dict] = None):
    """
    Send web push notification using pywebpush
    """
    try:
        from pywebpush import webpush, WebPushException
        import os
        
        # Check if web push is configured
        vapid_private_key = os.getenv('VAPID_PRIVATE_KEY')
        vapid_public_key = os.getenv('VAPID_PUBLIC_KEY')
        vapid_claims = {"sub": os.getenv('VAPID_EMAIL', 'mailto:admin@vikrahub.com')}
        
        if not vapid_private_key or not vapid_public_key:
            logger.warning("VAPID keys not configured for web push")
            return
        
        # Prepare subscription info
        subscription_info = {
            "endpoint": device.endpoint,
            "keys": {
                "p256dh": device.p256dh_key,
                "auth": device.auth_key
            }
        }
        
        # Prepare notification payload
        notification_payload = {
            "title": title,
            "body": body,
            "icon": "/static/icons/icon-192x192.png",
            "badge": "/static/icons/badge-72x72.png",
            "data": data or {}
        }
        
        # Send the push notification
        webpush(
            subscription_info=subscription_info,
            data=json.dumps(notification_payload),
            vapid_private_key=vapid_private_key,
            vapid_claims=vapid_claims
        )
        
        # Update device last_used
        device.last_used = timezone.now()
        device.save(update_fields=['last_used'])
        
        logger.debug(f"Sent web push to device {device.id}")
        
    except WebPushException as e:
        logger.warning(f"Web push failed for device {device.id}: {e}")
        if e.response and e.response.status_code in [404, 410]:
            # Token is invalid, deactivate device
            device.is_active = False
            device.save()
    except ImportError:
        logger.warning("pywebpush not installed - web push notifications disabled")
    except Exception as e:
        logger.error(f"Web push error for device {device.id}: {e}")


def send_fcm_push(device: Device, title: str, body: str, data: Optional[Dict] = None):
    """
    Send FCM push notification for iOS/Android
    """
    try:
        from pyfcm import FCMNotification
        import os
        
        # Check if FCM is configured
        fcm_server_key = os.getenv('FCM_SERVER_KEY')
        if not fcm_server_key:
            logger.warning("FCM server key not configured")
            return
        
        push_service = FCMNotification(api_key=fcm_server_key)
        
        # Send the notification
        result = push_service.notify_single_device(
            registration_id=device.token,
            message_title=title,
            message_body=body,
            data_message=data or {}
        )
        
        # Check if token is invalid
        if result and 'failure' in result and result['failure'] > 0:
            if 'results' in result:
                for res in result['results']:
                    if 'error' in res and res['error'] in ['NotRegistered', 'InvalidRegistration']:
                        device.is_active = False
                        device.save()
                        logger.warning(f"Deactivated invalid FCM token for device {device.id}")
                        break
        
        # Update device last_used
        device.last_used = timezone.now()
        device.save(update_fields=['last_used'])
        
        logger.debug(f"Sent FCM push to device {device.id}")
        
    except ImportError:
        logger.warning("pyfcm not installed - FCM push notifications disabled")
    except Exception as e:
        logger.error(f"FCM push error for device {device.id}: {e}")


def create_message_notification(sender: User, recipient: User, message_content: str):
    """
    Create notification for new message
    """
    if sender == recipient:
        return  # Don't notify self
    
    preview = message_content[:100] + "..." if len(message_content) > 100 else message_content
    
    return create_notification(
        user=recipient,
        verb="message",
        actor=sender,
        payload={
            "preview": preview,
            "message_length": len(message_content)
        },
        message=f"{sender.get_full_name() or sender.username} sent you a message"
    )


def create_follow_notification(follower: User, followed: User):
    """
    Create notification for new follow
    """
    if follower == followed:
        return  # Don't notify self
    
    return create_notification(
        user=followed,
        verb="follow",
        actor=follower,
        payload={
            "follower_username": follower.username,
            "follower_name": follower.get_full_name() or follower.username
        },
        message=f"{follower.get_full_name() or follower.username} started following you"
    )


def create_reaction_notification(reactor: User, message_owner: User, reaction_type: str):
    """
    Create notification for message reaction
    """
    if reactor == message_owner:
        return  # Don't notify self
    
    return create_notification(
        user=message_owner,
        verb="reaction",
        actor=reactor,
        payload={
            "reaction_type": reaction_type,
            "reactor_username": reactor.username
        },
        message=f"{reactor.get_full_name() or reactor.username} reacted {reaction_type} to your message"
    )


def create_reply_notification(replier: User, original_sender: User, reply_content: str):
    """
    Create notification for message reply
    """
    if replier == original_sender:
        return  # Don't notify self
    
    preview = reply_content[:100] + "..." if len(reply_content) > 100 else reply_content
    
    return create_notification(
        user=original_sender,
        verb="reply",
        actor=replier,
        payload={
            "preview": preview,
            "reply_length": len(reply_content)
        },
        message=f"{replier.get_full_name() or replier.username} replied to your message"
    )


def cleanup_old_notifications(days: int = 30):
    """
    Clean up old read notifications
    """
    from datetime import timedelta
    
    cutoff_date = timezone.now() - timedelta(days=days)
    deleted_count, _ = Notification.objects.filter(
        is_read=True,
        created_at__lt=cutoff_date
    ).delete()
    
    logger.info(f"Cleaned up {deleted_count} old notifications")
    return deleted_count
