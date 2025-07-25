#!/usr/bin/env python
"""
Test script for the Follow System API endpoints
Run this to validate that the follow system API endpoints are working correctly.
"""
import os
import sys
import django
import json

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
django.setup()

# Add testserver to ALLOWED_HOSTS for testing
from django.conf import settings
if 'testserver' not in settings.ALLOWED_HOSTS:
    settings.ALLOWED_HOSTS.append('testserver')

from django.test import Client
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.authtoken.models import Token
from rest_framework_simplejwt.tokens import RefreshToken

def test_follow_api():
    """Test the follow system API endpoints"""
    print("🧪 Testing Follow API Endpoints...")
    print("=" * 50)
    
    # Create test client
    client = Client()
    
    # 1. Create test users
    print("1. Setting up test users...")
    try:
        # Clean up existing test users
        User.objects.filter(username__in=['testapi1', 'testapi2']).delete()
        
        user1 = User.objects.create_user(username='testapi1', email='testapi1@example.com', password='testpass123')
        user2 = User.objects.create_user(username='testapi2', email='testapi2@example.com', password='testpass123')
        
        # Create JWT tokens for authentication
        refresh1 = RefreshToken.for_user(user1)
        refresh2 = RefreshToken.for_user(user2)
        token1 = str(refresh1.access_token)
        token2 = str(refresh2.access_token)
        
        print(f"   ✅ Created user1: {user1.username}")
        print(f"   ✅ Created user2: {user2.username}")
        print(f"   ✅ Generated JWT tokens")
        
    except Exception as e:
        print(f"   ❌ Error setting up users: {e}")
        return False
    
    # 2. Test Follow API
    print("\n2. Testing follow endpoint...")
    try:
        response = client.post(
            '/api/follow/follow/',
            {'user_id': user2.id},
            HTTP_AUTHORIZATION=f'Bearer {token1}',
            content_type='application/json'
        )
        
        if response.status_code == 201:
            print(f"   ✅ Follow API successful: {response.status_code}")
            print(f"   📄 Response: {json.loads(response.content)}")
        else:
            print(f"   ❌ Follow API failed: {response.status_code}")
            print(f"   📄 Response: {response.content}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error testing follow API: {e}")
        return False
    
    # 3. Test Follow Stats API
    print("\n3. Testing follow stats endpoint...")
    try:
        response = client.get(
            f'/api/follow/stats/{user2.id}/',
            HTTP_AUTHORIZATION=f'Bearer {token1}',
        )
        
        if response.status_code == 200:
            print(f"   ✅ Stats API successful: {response.status_code}")
            stats_data = json.loads(response.content)
            print(f"   📄 Stats: {stats_data}")
        else:
            print(f"   ❌ Stats API failed: {response.status_code}")
            print(f"   📄 Response: {response.content}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error testing stats API: {e}")
        return False
    
    # 4. Test Followers List API
    print("\n4. Testing followers list endpoint...")
    try:
        response = client.get(
            f'/api/follow/followers/{user2.id}/',
            HTTP_AUTHORIZATION=f'Bearer {token1}',
        )
        
        if response.status_code == 200:
            print(f"   ✅ Followers API successful: {response.status_code}")
            followers_data = json.loads(response.content)
            print(f"   📄 Followers: {len(followers_data.get('results', []))} found")
        else:
            print(f"   ❌ Followers API failed: {response.status_code}")
            print(f"   📄 Response: {response.content}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error testing followers API: {e}")
        return False
    
    # 5. Test Unfollow API
    print("\n5. Testing unfollow endpoint...")
    try:
        response = client.post(
            f'/api/follow/unfollow/{user2.id}/',
            HTTP_AUTHORIZATION=f'Bearer {token1}',
            content_type='application/json'
        )
        
        if response.status_code == 200:
            print(f"   ✅ Unfollow API successful: {response.status_code}")
            print(f"   📄 Response: {json.loads(response.content)}")
        else:
            print(f"   ❌ Unfollow API failed: {response.status_code}")
            print(f"   📄 Response: {response.content}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error testing unfollow API: {e}")
        return False
    
    # 6. Test Follow Notifications API
    print("\n6. Testing follow notifications endpoint...")
    try:
        response = client.get(
            '/api/follow/notifications/',
            HTTP_AUTHORIZATION=f'Bearer {token2}',
        )
        
        if response.status_code == 200:
            print(f"   ✅ Notifications API successful: {response.status_code}")
            notifications_data = json.loads(response.content)
            print(f"   📄 Notifications: {len(notifications_data.get('results', []))} found")
        else:
            print(f"   ❌ Notifications API failed: {response.status_code}")
            print(f"   📄 Response: {response.content}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error testing notifications API: {e}")
        return False
    
    print("\n" + "=" * 50)
    print("🎉 All API tests passed! Follow API endpoints are working correctly.")
    return True

if __name__ == "__main__":
    success = test_follow_api()
    if success:
        print("\n✅ Follow API is ready for production!")
    else:
        print("\n❌ Follow API needs fixes before deployment.")
        print("\n💡 Make sure:")
        print("   - Django server is running")
        print("   - URLs are properly configured")
        print("   - All migrations are applied")
        sys.exit(1)
