#!/usr/bin/env python
"""
Test script to verify automatic profile creation functionality
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
from core.models import UserProfile, CreatorProfile, FreelancerProfile, ClientProfile

def test_profile_creation():
    print("Testing automatic profile creation...")
    
    # Test data for new users
    test_users = [
        {'username': 'test_creator', 'email': 'creator@test.com', 'user_type': 'creator'},
        {'username': 'test_freelancer', 'email': 'freelancer@test.com', 'user_type': 'freelancer'},
        {'username': 'test_client', 'email': 'client@test.com', 'user_type': 'client'},
    ]
    
    for user_data in test_users:
        try:
            # Delete user if exists (for testing)
            User.objects.filter(username=user_data['username']).delete()
            
            # Create user (this should trigger the signal)
            user = User.objects.create_user(
                username=user_data['username'],
                email=user_data['email'],
                password='testpass123'
            )
            
            # Update user profile with the user_type
            profile = user.userprofile
            profile.user_type = user_data['user_type']
            profile.save()  # This should trigger the specialized profile creation
            
            # Check if specialized profile was created
            user_type = user_data['user_type']
            if user_type == 'creator':
                creator_profile = CreatorProfile.objects.filter(user=user).first()
                print(f"✅ CreatorProfile created for {user.username}: {creator_profile is not None}")
                if creator_profile:
                    print(f"   - Creator type: {creator_profile.creator_type}")
                    print(f"   - Experience: {creator_profile.experience_level}")
                    print(f"   - Available for commissions: {creator_profile.available_for_commissions}")
            
            elif user_type == 'freelancer':
                freelancer_profile = FreelancerProfile.objects.filter(user=user).first()
                print(f"✅ FreelancerProfile created for {user.username}: {freelancer_profile is not None}")
                if freelancer_profile:
                    print(f"   - Title: {freelancer_profile.title}")
                    print(f"   - Hourly rate: ${freelancer_profile.hourly_rate}")
                    print(f"   - Availability: {freelancer_profile.availability}")
            
            elif user_type == 'client':
                client_profile = ClientProfile.objects.filter(user=user).first()
                print(f"✅ ClientProfile created for {user.username}: {client_profile is not None}")
                if client_profile:
                    print(f"   - Client type: {client_profile.client_type}")
                    print(f"   - Company size: {client_profile.company_size}")
            
        except Exception as e:
            print(f"❌ Error testing {user_data['username']}: {e}")
    
    print("\n" + "="*50)
    print("Profile Creation Test Complete!")
    print("="*50)

if __name__ == '__main__':
    test_profile_creation()
