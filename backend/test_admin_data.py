#!/usr/bin/env python
"""
Test Django Admin data access
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

def test_admin_data():
    print("🔍 TESTING DJANGO ADMIN DATA ACCESS...")
    print("="*50)
    
    print("\n🎨 CREATOR PROFILES:")
    creators = CreatorProfile.objects.all().select_related('user')
    print(f"Count: {creators.count()}")
    for creator in creators:
        print(f"  - {creator.user.username} ({creator.user.first_name} {creator.user.last_name})")
        print(f"    Creator Type: {creator.creator_type}")
        print(f"    Experience: {creator.experience_level}")
    
    print("\n💼 FREELANCER PROFILES:")
    freelancers = FreelancerProfile.objects.all().select_related('user')
    print(f"Count: {freelancers.count()}")
    for freelancer in freelancers:
        print(f"  - {freelancer.user.username} ({freelancer.user.first_name} {freelancer.user.last_name})")
        print(f"    Title: {freelancer.title}")
        print(f"    Rate: ${freelancer.hourly_rate}")
    
    print("\n🏢 CLIENT PROFILES:")
    clients = ClientProfile.objects.all().select_related('user')
    print(f"Count: {clients.count()}")
    for client in clients:
        print(f"  - {client.user.username} ({client.user.first_name} {client.user.last_name})")
        print(f"    Type: {client.client_type}")
        print(f"    Company: {client.company_name or 'N/A'}")
    
    print("\n" + "="*50)
    print("✅ Django Admin should show these users in their respective sections!")
    print("If still not showing, try:")
    print("1. Clear browser cache and refresh Django Admin")
    print("2. Restart Django server")
    print("3. Check Django Admin URLs directly:")
    print("   - /admin/core/creatorprofile/")
    print("   - /admin/core/freelancerprofile/")
    print("   - /admin/core/clientprofile/")

if __name__ == '__main__':
    test_admin_data()
