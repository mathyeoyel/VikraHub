#!/usr/bin/env python3
import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
django.setup()

from core.serializers import UserProfileSerializer
from django.contrib.auth.models import User
from core.models import UserProfile, ClientProfile
import json

def test_client_profile_creation():
    print("Testing client profile functionality...")
    
    # Create a test user (delete if exists)
    try:
        existing_user = User.objects.get(username='test_client')
        existing_user.delete()
        print("Deleted existing test user")
    except User.DoesNotExist:
        pass
    
    # Create fresh test user
    user = User.objects.create_user(username='test_client', email='client@test.com', password='test123')
    
    # Get or create profile (in case it already exists from signals)
    profile, created = UserProfile.objects.get_or_create(
        user=user, 
        defaults={'user_type': 'client'}
    )
    if not created:
        profile.user_type = 'client'
        profile.save()
    print(f"{'Created' if created else 'Updated'} user profile: {profile.user.username}")

    # Test serializer with client data
    client_data = {
        'bio': 'Test client bio',
        'client_type': 'business',
        'company_name': 'Test Company Ltd',
        'industry': 'Technology',
        'company_size': 'medium',  # Use valid choice
        'typical_budget_range': '$10,000-$50,000',
        'project_types': 'Web Development, Mobile Apps',  # String format
        'business_address': '123 Tech Street, Silicon Valley',
        'contact_person': 'John Doe',
        'phone_number': '+1-555-0123'
    }

    # Test serializer validation
    serializer = UserProfileSerializer(instance=profile, data=client_data, partial=True)
    is_valid = serializer.is_valid()
    print(f"Serializer valid: {is_valid}")
    
    if not is_valid:
        print(f"Validation errors: {serializer.errors}")
        return False

    # Test serializer save
    try:
        updated_profile = serializer.save()
        print("Profile updated successfully")
        
        # Check if client profile was created
        client_profile = ClientProfile.objects.get(user=updated_profile.user)
        print(f"Client profile created: {client_profile.company_name}")
        print(f"Industry: {client_profile.industry}")
        print(f"Budget range: {client_profile.typical_budget_range}")
        
        # Test serializer representation (API response)
        response_data = UserProfileSerializer(updated_profile).data
        print("API response includes client_profile:", 'client_profile' in response_data)
        if 'client_profile' in response_data:
            print(f"Client profile data: {response_data['client_profile']}")
        
        print("✅ All tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Error during save: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_client_profile_creation()
    sys.exit(0 if success else 1)
