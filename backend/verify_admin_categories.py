#!/usr/bin/env python
"""
Script to verify that users appear in their respective admin categories
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

def verify_admin_categories():
    print("Verifying admin categorization...")
    print("="*50)
    
    # Get all users
    all_users = User.objects.all()
    print(f"Total users in system: {all_users.count()}")
    
    # Check creators
    creators = CreatorProfile.objects.all()
    print(f"\n🎨 CREATORS ({creators.count()}):")
    for creator in creators:
        user_profile = creator.user.userprofile
        print(f"  - {creator.user.username} ({creator.user.first_name} {creator.user.last_name})")
        print(f"    Type: {creator.get_creator_type_display()}")
        print(f"    Experience: {creator.get_experience_level_display()}")
        print(f"    User Profile Type: {user_profile.user_type}")
        print()
    
    # Check freelancers
    freelancers = FreelancerProfile.objects.all()
    print(f"💼 FREELANCERS ({freelancers.count()}):")
    for freelancer in freelancers:
        user_profile = freelancer.user.userprofile
        print(f"  - {freelancer.user.username} ({freelancer.user.first_name} {freelancer.user.last_name})")
        print(f"    Title: {freelancer.title}")
        print(f"    Hourly Rate: ${freelancer.hourly_rate}")
        print(f"    Skill Level: {freelancer.get_skill_level_display()}")
        print(f"    User Profile Type: {user_profile.user_type}")
        print()
    
    # Check clients
    clients = ClientProfile.objects.all()
    print(f"🏢 CLIENTS ({clients.count()}):")
    for client in clients:
        user_profile = client.user.userprofile
        print(f"  - {client.user.username} ({client.user.first_name} {client.user.last_name})")
        print(f"    Client Type: {client.get_client_type_display()}")
        print(f"    Company: {client.company_name or 'N/A'}")
        print(f"    User Profile Type: {user_profile.user_type}")
        print()
    
    # Check for any users without specialized profiles
    print("🔍 CHECKING FOR MISSING PROFILES:")
    missing_profiles = []
    for user in all_users:
        try:
            user_profile = user.userprofile
            user_type = user_profile.user_type
            
            has_specialized = False
            if user_type == 'creator' and hasattr(user, 'creator_profile'):
                has_specialized = True
            elif user_type == 'freelancer' and hasattr(user, 'freelancer_profile'):
                has_specialized = True
            elif user_type == 'client' and hasattr(user, 'client_profile'):
                has_specialized = True
            
            if not has_specialized:
                missing_profiles.append((user.username, user_type))
        except:
            missing_profiles.append((user.username, 'no_profile'))
    
    if missing_profiles:
        print("❌ Users missing specialized profiles:")
        for username, user_type in missing_profiles:
            print(f"  - {username} (should have {user_type} profile)")
    else:
        print("✅ All users have appropriate specialized profiles!")
    
    print("\n" + "="*50)
    print("Admin Categorization Verification Complete!")
    print("="*50)

if __name__ == '__main__':
    verify_admin_categories()
