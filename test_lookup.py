#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.insert(0, '/workspaces/VikraHub/backend')

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
os.environ.setdefault('DJANGO_SECRET_KEY', 'test-key-for-dev')
os.environ.setdefault('DEBUG', 'True')

django.setup()

from django.contrib.auth.models import User
from core.models import UserProfile
from django.shortcuts import get_object_or_404
from django.http import Http404

def test_lookup():
    """Test the lookup logic"""
    print("Testing public profile lookup logic...")
    
    # Test 1: Non-existent user should raise 404
    try:
        user = get_object_or_404(
            User.objects.only("id", "username", "date_joined")
            .filter(username__iexact='nonexistent')
        )
        print("❌ ERROR: Should have raised 404")
    except Http404:
        print("✅ SUCCESS: 404 raised for nonexistent user")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
    
    # Test 2: Create and test existing user
    try:
        # Clean up any existing test user
        User.objects.filter(username__iexact='TestUser').delete()
        
        test_user = User.objects.create_user(
            username='TestUser', 
            email='test@example.com'
        )
        user = get_object_or_404(
            User.objects.only("id", "username", "date_joined")
            .filter(username__iexact='testuser')
        )
        print(f"✅ SUCCESS: Found user {user.username} with case-insensitive lookup")
        
        # Test profile creation
        profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'user_type': 'client',
                'bio': '',
                'skills': '',
                'headline': '',
                'location': '',
                'website': '',
                'achievements': '',
                'services_offered': '',
            }
        )
        print(f"✅ SUCCESS: Profile {'created' if created else 'found'} for user")
        
    except Exception as e:
        print(f"❌ Error creating/finding user: {e}")

if __name__ == "__main__":
    test_lookup()
