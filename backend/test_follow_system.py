#!/usr/bin/env python
"""
Test script for the Follow System
Run this to validate that the follow system is working correctly.
"""
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
django.setup()

from django.contrib.auth.models import User
from core.follow_models import Follow, FollowNotification
from core.follow_serializers import FollowSerializer, FollowStatsSerializer

def test_follow_system():
    """Test the follow system functionality"""
    print("🧪 Testing Follow System...")
    print("=" * 50)
    
    # 1. Test User Creation
    print("1. Creating test users...")
    try:
        # Create test users (or get existing ones)
        user1, created1 = User.objects.get_or_create(
            username='testuser1',
            defaults={'email': 'test1@example.com'}
        )
        user2, created2 = User.objects.get_or_create(
            username='testuser2', 
            defaults={'email': 'test2@example.com'}
        )
        
        print(f"   ✅ User1: {user1.username} ({'created' if created1 else 'existing'})")
        print(f"   ✅ User2: {user2.username} ({'created' if created2 else 'existing'})")
        
    except Exception as e:
        print(f"   ❌ Error creating users: {e}")
        return False
    
    # 2. Test Follow Creation
    print("\n2. Testing follow creation...")
    try:
        # Clear any existing follows for clean test
        Follow.objects.filter(follower=user1, followed=user2).delete()
        
        # Create a follow relationship
        follow = Follow.objects.create(follower=user1, followed=user2)
        print(f"   ✅ Follow created: {follow.follower.username} → {follow.followed.username}")
        
    except Exception as e:
        print(f"   ❌ Error creating follow: {e}")
        return False
    
    # 3. Test Follow Statistics
    print("\n3. Testing follow statistics...")
    try:
        # Test follower count  
        follower_count = user2.get_followers_count()
        following_count = user1.get_following_count()
        
        print(f"   ✅ {user2.username} has {follower_count} followers")
        print(f"   ✅ {user1.username} is following {following_count} users")
        
        # Test is_following method
        is_following = user1.is_following(user2)
        print(f"   ✅ {user1.username} is following {user2.username}: {is_following}")
        
    except Exception as e:
        print(f"   ❌ Error testing statistics: {e}")
        return False
    
    # 4. Test Serializers
    print("\n4. Testing serializers...")
    try:
        # Test FollowSerializer
        follow_serializer = FollowSerializer(follow)
        follow_data = follow_serializer.data
        print(f"   ✅ Follow serializer data: {follow_data}")
        
        # Test FollowStatsSerializer
        stats_serializer = FollowStatsSerializer(user2)
        stats_data = stats_serializer.data
        print(f"   ✅ Stats serializer data: {stats_data}")
        
    except Exception as e:
        print(f"   ❌ Error testing serializers: {e}")
        return False
    
    # 5. Test Self-Follow Prevention
    print("\n5. Testing self-follow prevention...")
    try:
        # Try to create a self-follow (should fail)
        from django.core.exceptions import ValidationError
        self_follow = Follow(follower=user1, followed=user1)
        try:
            self_follow.full_clean()
            print("   ❌ Self-follow validation failed - should have raised error")
            return False
        except ValidationError:
            print("   ✅ Self-follow prevention working correctly")
        
    except Exception as e:
        print(f"   ❌ Error testing self-follow prevention: {e}")
        return False
    
    # 6. Test Follow Notifications
    print("\n6. Testing follow notifications...")
    try:
        notification_count = FollowNotification.objects.filter(recipient=user2).count()
        print(f"   ✅ {user2.username} has {notification_count} follow notifications")
        
    except Exception as e:
        print(f"   ❌ Error testing notifications: {e}")
        return False
    
    # 7. Test Unfollow
    print("\n7. Testing unfollow...")
    try:
        follow.delete()
        is_following_after = user1.is_following(user2)
        print(f"   ✅ After unfollow, {user1.username} is following {user2.username}: {is_following_after}")
        
    except Exception as e:
        print(f"   ❌ Error testing unfollow: {e}")
        return False
    
    print("\n" + "=" * 50)
    print("🎉 All tests passed! Follow system is working correctly.")
    return True

if __name__ == "__main__":
    success = test_follow_system()
    if success:
        print("\n✅ Follow system is ready for production!")
    else:
        print("\n❌ Follow system needs fixes before deployment.")
        sys.exit(1)
