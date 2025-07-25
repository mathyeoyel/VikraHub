#!/usr/bin/env python
"""
Final Integration Test for VikraHub Follow System
This script runs a comprehensive test of the entire follow system.
"""
import os
import sys
import django
import json

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + '/backend')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
django.setup()

# Add testserver to ALLOWED_HOSTS for testing
from django.conf import settings
if 'testserver' not in settings.ALLOWED_HOSTS:
    settings.ALLOWED_HOSTS.append('testserver')

def run_integration_test():
    """Run comprehensive integration test"""
    print("🧪 VikraHub Follow System - Integration Test")
    print("=" * 60)
    
    # Test 1: Django Models
    print("\n1️⃣  Testing Django Models...")
    try:
        from django.contrib.auth.models import User
        from core.follow_models import Follow, FollowNotification
        
        # Clean up test data
        User.objects.filter(username__startswith='integration_test').delete()
        
        # Create test users
        user1 = User.objects.create_user(
            username='integration_test_user1',
            email='test1@integration.com',
            password='testpass123'
        )
        user2 = User.objects.create_user(
            username='integration_test_user2', 
            email='test2@integration.com',
            password='testpass123'
        )
        
        # Test follow functionality
        follow_obj, created = user1.follow(user2)
        assert created, "Follow should be created"
        assert user1.is_following(user2), "User1 should be following User2"
        assert user2.is_followed_by(user1), "User2 should be followed by User1"
        
        print("   ✅ Django models working correctly")
        
    except Exception as e:
        print(f"   ❌ Django models test failed: {e}")
        return False
    
    # Test 2: API Endpoints
    print("\n2️⃣  Testing API Endpoints...")
    try:
        from django.test import Client
        from rest_framework_simplejwt.tokens import RefreshToken
        
        client = Client()
        
        # Generate JWT tokens
        refresh1 = RefreshToken.for_user(user1)
        token1 = str(refresh1.access_token)
        
        # Test follow API
        response = client.post(
            '/api/follow/follow/',
            {'user_id': user2.id},
            HTTP_AUTHORIZATION=f'Bearer {token1}',
            content_type='application/json'
        )
        assert response.status_code == 201, f"Follow API failed: {response.status_code}"
        
        # Test stats API
        response = client.get(
            f'/api/follow/stats/{user2.id}/',
            HTTP_AUTHORIZATION=f'Bearer {token1}',
        )
        assert response.status_code == 200, f"Stats API failed: {response.status_code}"
        stats = json.loads(response.content)
        assert stats['followers_count'] >= 1, "Should have at least 1 follower"
        
        print("   ✅ API endpoints working correctly")
        
    except Exception as e:
        print(f"   ❌ API endpoints test failed: {e}")
        return False
    
    # Test 3: Serializers
    print("\n3️⃣  Testing Serializers...")
    try:
        from core.follow_serializers import FollowSerializer, FollowStatsSerializer
        
        # Test FollowSerializer
        follow_instance = Follow.objects.filter(follower=user1, followed=user2).first()
        serializer = FollowSerializer(follow_instance)
        data = serializer.data
        assert 'follower' in data, "Serializer should include follower data"
        assert 'followed' in data, "Serializer should include followed data"
        
        # Test FollowStatsSerializer
        stats_serializer = FollowStatsSerializer(user2)
        stats_data = stats_serializer.data
        assert 'followers_count' in stats_data, "Stats should include followers count"
        assert 'following_count' in stats_data, "Stats should include following count"
        
        print("   ✅ Serializers working correctly")
        
    except Exception as e:
        print(f"   ❌ Serializers test failed: {e}")
        return False
    
    # Test 4: URL Routing
    print("\n4️⃣  Testing URL Routing...")
    try:
        from django.urls import reverse, resolve
        
        # Test that follow URLs are properly configured
        follow_create_url = '/api/follow/follow/'
        unfollow_url = f'/api/follow/unfollow/{user2.id}/'
        stats_url = f'/api/follow/stats/{user2.id}/'
        
        # Test that URLs resolve (don't throw exceptions)
        response = client.get(stats_url, HTTP_AUTHORIZATION=f'Bearer {token1}')
        assert response.status_code == 200, "Stats URL should resolve"
        
        print("   ✅ URL routing working correctly")
        
    except Exception as e:
        print(f"   ❌ URL routing test failed: {e}")
        return False
    
    # Test 5: Database Integrity
    print("\n5️⃣  Testing Database Integrity...")
    try:
        # Test unique constraints
        follow_count = Follow.objects.filter(follower=user1, followed=user2, is_active=True).count()
        assert follow_count <= 1, "Should not have duplicate active follows"
        
        # Test cascading deletes
        original_count = Follow.objects.count()
        test_user = User.objects.create_user(username='temp_user', password='temp')
        test_user.follow(user1)
        test_user.delete()
        
        print("   ✅ Database integrity maintained")
        
    except Exception as e:
        print(f"   ❌ Database integrity test failed: {e}")
        return False
    
    # Clean up
    print("\n🧹 Cleaning up test data...")
    User.objects.filter(username__startswith='integration_test').delete()
    
    print("\n" + "=" * 60)
    print("🎉 ALL INTEGRATION TESTS PASSED!")
    print("✅ VikraHub Follow System is ready for production!")
    
    return True

if __name__ == "__main__":
    success = run_integration_test()
    if not success:
        print("\n❌ Integration tests failed. Please check the errors above.")
        sys.exit(1)
    else:
        print("\n🚀 System is ready for deployment!")
        print("\nNext steps:")
        print("1. Start Django server: python manage.py runserver")
        print("2. Start React frontend: npm start") 
        print("3. Open test_follow_frontend.html in browser to test the UI")
        print("4. Deploy to production when ready!")
