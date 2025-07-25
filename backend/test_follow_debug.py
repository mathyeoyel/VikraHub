#!/usr/bin/env python3
"""
Test follow functionality to debug the issue
"""
import os
import sys
import django
import requests
import json

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SECRET_KEY', 'test-key')
os.environ.setdefault('DEBUG', 'True')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
django.setup()

from django.contrib.auth.models import User
from django.test import Client
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

def get_tokens_for_user(user):
    """Get JWT tokens for a user"""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

def test_follow_api():
    """Test the follow API endpoint"""
    print("🧪 Testing Follow API Functionality")
    print("=" * 50)
    
    # Get test users
    users = User.objects.all()[:3]
    if len(users) < 2:
        print("❌ Need at least 2 users to test follow functionality")
        return
    
    user1 = users[0]  # Follower
    user2 = users[1]  # Followed
    
    print(f"👤 User 1 (Follower): {user1.username} (ID: {user1.id})")
    print(f"👤 User 2 (Followed): {user2.username} (ID: {user2.id})")
    print()
    
    # Create API client
    client = APIClient()
    
    # Get JWT token for user1
    tokens = get_tokens_for_user(user1)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens["access"]}')
    
    print("🔑 JWT Token obtained for user1")
    print()
    
    # Test follow endpoint
    print("📍 Testing Follow Endpoint")
    follow_url = '/api/follow/follow/'
    follow_data = {'user_id': user2.id}
    
    print(f"URL: {follow_url}")
    print(f"Data: {follow_data}")
    print(f"Headers: Authorization: Bearer {tokens['access'][:20]}...")
    print()
    
    try:
        response = client.post(follow_url, follow_data, format='json')
        print(f"📊 Response Status: {response.status_code}")
        print(f"📄 Response Headers: {dict(response.items())}")
        print(f"📝 Response Data: {response.data}")
        
        if response.status_code == 201:
            print("✅ Follow request successful!")
        else:
            print(f"❌ Follow request failed: {response.data}")
            
    except Exception as e:
        print(f"❌ Exception during follow request: {e}")
        import traceback
        traceback.print_exc()
    
    print()
    
    # Test unfollow endpoint
    print("📍 Testing Unfollow Endpoint")
    unfollow_url = f'/api/follow/unfollow/{user2.id}/'
    
    try:
        response = client.post(unfollow_url, format='json')
        print(f"📊 Response Status: {response.status_code}")
        print(f"📝 Response Data: {response.data}")
        
        if response.status_code == 200:
            print("✅ Unfollow request successful!")
        else:
            print(f"❌ Unfollow request failed: {response.data}")
            
    except Exception as e:
        print(f"❌ Exception during unfollow request: {e}")
        import traceback
        traceback.print_exc()

def test_url_routing():
    """Test URL routing"""
    print("\n🛣️  Testing URL Routing")
    print("=" * 30)
    
    from django.urls import reverse
    from django.test import Client
    
    client = Client()
    
    # Test follow URLs
    urls_to_test = [
        '/api/follow/follow/',
        '/api/follow/unfollow/2/',
        '/api/follow/stats/2/',
    ]
    
    for url in urls_to_test:
        try:
            response = client.get(url)
            print(f"URL: {url} - Status: {response.status_code}")
        except Exception as e:
            print(f"URL: {url} - Error: {e}")

if __name__ == "__main__":
    test_url_routing()
    test_follow_api()
