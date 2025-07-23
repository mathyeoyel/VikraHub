#!/usr/bin/env python
"""
Diagnostic script to check and fix user profile types
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

def diagnose_and_fix_profiles():
    print("🔍 DIAGNOSING USER PROFILE ISSUES...")
    print("="*60)
    
    all_users = User.objects.all()
    print(f"Total users: {all_users.count()}")
    
    print("\n📊 CURRENT USERPROFILE TYPES:")
    for user in all_users:
        try:
            profile = user.userprofile
            print(f"  {user.username}: user_type = '{profile.user_type}'")
        except UserProfile.DoesNotExist:
            print(f"  {user.username}: NO USERPROFILE!")
    
    print("\n🔧 FIXING KNOWN CREATORS...")
    # Fix known creators based on your previous setup
    known_creators = ['mathewyel', 'akon_peter', 'maduot_chongo', 'awut_paul']
    for username in known_creators:
        try:
            user = User.objects.get(username=username)
            profile, created = UserProfile.objects.get_or_create(user=user)
            if profile.user_type != 'creator':
                print(f"  Updating {username}: {profile.user_type} → creator")
                profile.user_type = 'creator'
                profile.save()
            else:
                print(f"  {username}: already creator ✓")
        except User.DoesNotExist:
            print(f"  {username}: user not found")
    
    print("\n🔧 FIXING KNOWN FREELANCERS...")
    # Fix known freelancers  
    known_freelancers = ['testuser3', 'buay_moses', 'grace_pascal', 'james_mayen']
    for username in known_freelancers:
        try:
            user = User.objects.get(username=username)
            profile, created = UserProfile.objects.get_or_create(user=user)
            if profile.user_type != 'freelancer':
                print(f"  Updating {username}: {profile.user_type} → freelancer")
                profile.user_type = 'freelancer'
                profile.save()
            else:
                print(f"  {username}: already freelancer ✓")
        except User.DoesNotExist:
            print(f"  {username}: user not found")
    
    print("\n🔧 CREATING SPECIALIZED PROFILES...")
    # Now create specialized profiles for all users
    for user in all_users:
        try:
            profile = user.userprofile
            user_type = profile.user_type
            
            if user_type == 'creator':
                creator_profile, created = CreatorProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'creator_type': 'other',
                        'experience_level': 'beginner',
                        'available_for_commissions': True
                    }
                )
                if created:
                    print(f"  ✅ Created CreatorProfile for {user.username}")
                else:
                    print(f"  ✓ CreatorProfile exists for {user.username}")
            
            elif user_type == 'freelancer':
                freelancer_profile, created = FreelancerProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'title': 'Freelancer',
                        'hourly_rate': 25.00,
                        'availability': 'Part-time',
                        'skill_level': 'intermediate'
                    }
                )
                if created:
                    print(f"  ✅ Created FreelancerProfile for {user.username}")
                else:
                    print(f"  ✓ FreelancerProfile exists for {user.username}")
            
            elif user_type == 'client':
                client_profile, created = ClientProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'client_type': 'individual',
                        'company_size': 'solo'
                    }
                )
                if created:
                    print(f"  ✅ Created ClientProfile for {user.username}")
                else:
                    print(f"  ✓ ClientProfile exists for {user.username}")
                    
        except Exception as e:
            print(f"  ❌ Error with {user.username}: {e}")
    
    print("\n📊 FINAL COUNTS:")
    creator_count = CreatorProfile.objects.count()
    freelancer_count = FreelancerProfile.objects.count()
    client_count = ClientProfile.objects.count()
    
    print(f"  CreatorProfiles: {creator_count}")
    print(f"  FreelancerProfiles: {freelancer_count}")
    print(f"  ClientProfiles: {client_count}")
    print(f"  Total: {creator_count + freelancer_count + client_count}")
    
    print("\n" + "="*60)
    print("✅ DIAGNOSIS AND FIXES COMPLETE!")
    print("Check Django Admin now - users should appear in correct categories")

if __name__ == '__main__':
    diagnose_and_fix_profiles()
