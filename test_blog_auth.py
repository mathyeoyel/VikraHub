#!/usr/bin/env python
"""
Test script to verify blog API authentication
"""
import os
import django
import requests

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
os.environ.setdefault('DJANGO_SECRET_KEY', 'dev-secret-key-for-testing')
os.environ.setdefault('DEBUG', 'True')

django.setup()

from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

def test_blog_api():
    User = get_user_model()
    
    # Get the first user
    user = User.objects.first()
    if not user:
        print("❌ No users found in database")
        return
    
    print(f"✅ Testing with user: {user.username} (ID: {user.id})")
    
    # Generate JWT token
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    
    print(f"🔑 Generated access token (length: {len(access_token)})")
    print(f"🔑 Token preview: {access_token[:20]}...")
    
    # Test the API endpoint
    url = "http://127.0.0.1:8000/api/blog/my_posts/"
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    print(f"🌐 Testing API endpoint: {url}")
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        print(f"📊 Response status: {response.status_code}")
        print(f"📊 Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Got {data.get('count', 0)} blog posts")
            print(f"📝 Response data: {data}")
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - is the Django server running on port 8000?")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_blog_api()
