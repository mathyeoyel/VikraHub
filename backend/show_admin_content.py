#!/usr/bin/env python
"""
Final verification script - shows exactly what should appear in Django Admin
"""
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
django.setup()

from core.models import CreatorProfile, FreelancerProfile, ClientProfile

def show_admin_content():
    print("🎯 WHAT YOU SHOULD SEE IN DJANGO ADMIN")
    print("="*60)
    
    print("\n🔗 DIRECT ADMIN URLS TO CHECK:")
    print("   http://localhost:8000/admin/core/creatorprofile/")
    print("   http://localhost:8000/admin/core/freelancerprofile/")
    print("   http://localhost:8000/admin/core/clientprofile/")
    print("   http://localhost:8000/admin/core/userprofile/")
    
    creators = CreatorProfile.objects.all()
    freelancers = FreelancerProfile.objects.all()
    clients = ClientProfile.objects.all()
    
    print(f"\n🎨 CREATOR PROFILES SECTION ({creators.count()} users):")
    print("   In Django Admin → Core → Creator profiles")
    for creator in creators:
        print(f"   ✓ {creator.user.username} - {creator.get_creator_type_display()}")
    
    print(f"\n💼 FREELANCER PROFILES SECTION ({freelancers.count()} users):")
    print("   In Django Admin → Core → Freelancer profiles")
    for freelancer in freelancers:
        print(f"   ✓ {freelancer.user.username} - {freelancer.title}")
    
    print(f"\n🏢 CLIENT PROFILES SECTION ({clients.count()} users):")
    print("   In Django Admin → Core → Client profiles")
    for client in clients:
        print(f"   ✓ {client.user.username} - {client.get_client_type_display()}")
    
    print("\n" + "="*60)
    print("📋 TROUBLESHOOTING STEPS:")
    print("1. Go to Django Admin: http://localhost:8000/admin/")
    print("2. Login with your superuser account")
    print("3. Look for 'CORE' section in the admin interface")
    print("4. Under CORE, you should see:")
    print("   - Creator profiles")
    print("   - Freelancer profiles") 
    print("   - Client profiles")
    print("   - User profiles")
    print("5. Click on each to see the users listed above")
    print("\n🔧 If still empty, try:")
    print("   - Clear browser cache completely")
    print("   - Use incognito/private browsing mode")
    print("   - Check the exact URLs listed above")
    print("   - Restart Django server: python manage.py runserver")

if __name__ == '__main__':
    show_admin_content()
