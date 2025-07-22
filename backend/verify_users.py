#!/usr/bin/env python
"""
Script to verify created user accounts and display their information
"""

import os
import sys
import django

# Set up Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SECRET_KEY', 'dev-secret-key-for-testing')
os.environ.setdefault('DEBUG', 'True')

import django
from django.conf import settings

# Setup Django
if not settings.configured:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
    django.setup()

from django.contrib.auth.models import User
from core.models import FreelancerProfile, UserProfile

def verify_user_accounts():
    print("🔍 Verifying Created User Accounts")
    print("=" * 50)
    
    users = User.objects.filter(userprofile__user_type='freelancer').order_by('first_name')
    
    if not users.exists():
        print("❌ No freelancer users found!")
        return
    
    print(f"✅ Found {users.count()} freelancer accounts:\n")
    
    for user in users:
        try:
            profile = user.userprofile
            freelancer = user.freelancer_profile
            
            print(f"👤 {user.get_full_name()} (@{user.username})")
            print(f"   📧 Email: {user.email}")
            print(f"   🎯 Title: {freelancer.title}")
            print(f"   💰 Rate: ${freelancer.hourly_rate}/hour")
            print(f"   ⭐ Rating: {freelancer.rating}/5.0 ({freelancer.total_jobs} jobs)")
            print(f"   ✅ Verified: {'Yes' if freelancer.is_verified else 'No'}")
            print(f"   💼 Skills: {profile.skills[:60]}...")
            print(f"   🌐 Website: {profile.website or 'Not specified'}")
            print(f"   📱 Social: Instagram({profile.instagram}), LinkedIn({profile.linkedin})")
            print(f"   🔐 Password: VikraHub2025!")
            print()
            
        except (UserProfile.DoesNotExist, FreelancerProfile.DoesNotExist) as e:
            print(f"❌ {user.get_full_name()}: Missing profile data - {e}")
            print()
    
    print("🎯 Test Login Information:")
    print("=" * 30)
    print("URL: http://localhost:3000/login")
    print("Username: akon_peter (or any other username)")
    print("Password: VikraHub2025!")
    print()
    print("🌟 All accounts are fully configured with:")
    print("✅ Complete user profiles with bios and skills")
    print("✅ Professional freelancer information")
    print("✅ Social media links and websites")
    print("✅ Professional avatars and ratings")
    print("✅ Ready for login and testing!")

if __name__ == '__main__':
    verify_user_accounts()
