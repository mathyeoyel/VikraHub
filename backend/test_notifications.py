#!/usr/bin/env python
# test_notifications.py - Test the enhanced notification system

import os
import django
import sys

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import Notification, Device
from core.notification_utils import create_notification

def test_notification_system():
    print("🧪 Testing Enhanced Notification System")
    print("=" * 50)
    
    # Get or create test users
    user1, created = User.objects.get_or_create(
        username='testuser1',
        defaults={
            'email': 'testuser1@example.com',
            'first_name': 'Test',
            'last_name': 'User1'
        }
    )
    
    user2, created = User.objects.get_or_create(
        username='testuser2',
        defaults={
            'email': 'testuser2@example.com',
            'first_name': 'Test',
            'last_name': 'User2'
        }
    )
    
    print(f"📝 Testing with users: {user1.username} and {user2.username}")
    
    # Test 1: Basic notification
    print("\n1️⃣  Testing basic notification...")
    notification1 = create_notification(
        user=user1,
        verb="test",
        message="Basic test notification"
    )
    print(f"✅ Created: {notification1}")
    
    # Test 2: Follow notification
    print("\n2️⃣  Testing follow notification...")
    notification2 = create_notification(
        user=user1,
        verb="follow",
        actor=user2,
        payload={"follower_name": user2.get_full_name() or user2.username},
        message=f"{user2.get_full_name() or user2.username} started following you"
    )
    print(f"✅ Created: {notification2}")
    
    # Test 3: Message notification
    print("\n3️⃣  Testing message notification...")
    notification3 = create_notification(
        user=user1,
        verb="message",
        actor=user2,
        payload={
            "preview": "Hello! This is a test message from the notification system.",
            "message_length": 56
        },
        message=f"{user2.get_full_name() or user2.username} sent you a message"
    )
    print(f"✅ Created: {notification3}")
    
    # Test 4: Device registration
    print("\n4️⃣  Testing device registration...")
    device = Device.objects.create(
        user=user1,
        token="test_web_push_token_12345",
        platform="web",
        auth_key="test_auth_key",
        p256dh_key="test_p256dh_key",
        endpoint="https://fcm.googleapis.com/test-endpoint"
    )
    print(f"✅ Created device: {device}")
    
    # Test 5: Query notifications
    print("\n5️⃣  Testing notification queries...")
    all_notifications = Notification.objects.filter(user=user1).order_by('-created_at')
    unread_notifications = all_notifications.filter(is_read=False)
    
    print(f"📊 Total notifications for {user1.username}: {all_notifications.count()}")
    print(f"📊 Unread notifications: {unread_notifications.count()}")
    
    # Display notifications
    print("\n📋 Notification Details:")
    for notification in all_notifications:
        print(f"  • {notification.verb.upper()}: {notification.title}")
        print(f"    Actor: {notification.actor.username if notification.actor else 'System'}")
        print(f"    Read: {'✅' if notification.is_read else '❌'}")
        print(f"    Created: {notification.created_at}")
        if notification.payload:
            print(f"    Payload: {notification.payload}")
        print()
    
    # Test 6: Mark as read
    print("6️⃣  Testing mark as read...")
    first_notification = unread_notifications.first()
    if first_notification:
        first_notification.mark_as_read()
        print(f"✅ Marked notification {first_notification.id} as read")
    
    # Final stats
    print("\n📈 Final Statistics:")
    print(f"  Total notifications: {Notification.objects.count()}")
    print(f"  Total devices: {Device.objects.count()}")
    print(f"  Users with notifications: {User.objects.filter(notifications__isnull=False).distinct().count()}")
    
    print("\n🎉 All tests completed successfully!")
    print("=" * 50)

if __name__ == "__main__":
    test_notification_system()
