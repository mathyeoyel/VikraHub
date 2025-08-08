#!/usr/bin/env python
"""
Test script for email verification system
This script demonstrates the email verification workflow
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import EmailVerification
from core.email_utils import send_verification_email
import uuid

def test_email_verification():
    """Test the email verification system"""
    print("🧪 Testing Email Verification System")
    print("=" * 50)
    
    # Create a test user
    test_email = "test@example.com"
    test_username = f"testuser_{uuid.uuid4().hex[:8]}"
    
    # Check if user already exists
    if User.objects.filter(email=test_email).exists():
        user = User.objects.get(email=test_email)
        print(f"📧 Using existing test user: {user.email}")
    else:
        user = User.objects.create_user(
            username=test_username,
            email=test_email,
            password="testpassword123",
            is_active=False  # User starts as inactive
        )
        print(f"👤 Created test user: {user.email}")
    
    print(f"✅ User active status: {user.is_active}")
    
    # Check existing verification
    existing_verification = EmailVerification.objects.filter(user=user, is_verified=False).first()
    if existing_verification:
        print(f"📮 Found existing verification token: {existing_verification.token}")
        verification = existing_verification
    else:
        # Send verification email
        print("📧 Sending verification email...")
        verification = send_verification_email(user)
        print(f"📮 Verification token created: {verification.token}")
    
    # Test verification process
    print("\n🔍 Testing verification process...")
    
    # Verify the token
    if verification.verify():
        print("✅ Token verification successful!")
        user.refresh_from_db()
        print(f"✅ User is now active: {user.is_active}")
    else:
        print("❌ Token verification failed!")
    
    # Check verification status
    verification.refresh_from_db()
    print(f"✅ Verification status: {'Verified' if verification.is_verified else 'Pending'}")
    
    print("\n📊 Email Verification Test Summary:")
    print(f"   • User created: {user.email}")
    print(f"   • User active: {user.is_active}")
    print(f"   • Verification token: {verification.token}")
    print(f"   • Verification status: {'✅ Verified' if verification.is_verified else '⏳ Pending'}")
    print(f"   • Token expires: {verification.expires_at}")
    
    return user, verification

def test_api_endpoints():
    """Test the email verification API endpoints"""
    print("\n🌐 Testing API Endpoints")
    print("=" * 50)
    
    from django.test import Client
    from django.urls import reverse
    import json
    
    client = Client()
    
    # Test user registration
    print("1. Testing user registration...")
    registration_data = {
        'username': f'apitest_{uuid.uuid4().hex[:8]}',
        'email': 'apitest@example.com',
        'password': 'testpassword123',
        'password2': 'testpassword123'
    }
    
    try:
        response = client.post('/api/auth/register/', registration_data)
        print(f"   Registration response: {response.status_code}")
        if response.status_code == 201:
            print("   ✅ User registration successful")
            response_data = json.loads(response.content)
            print(f"   📧 User created: {response_data.get('user', {}).get('email')}")
        else:
            print(f"   ❌ Registration failed: {response.content}")
    except Exception as e:
        print(f"   ❌ Registration error: {e}")
    
    # Get a verification token for testing
    user = User.objects.filter(email='apitest@example.com').first()
    if user:
        verification = EmailVerification.objects.filter(user=user, is_verified=False).first()
        if verification:
            print(f"\n2. Testing email verification with token: {verification.token}")
            
            # Test verification endpoint
            try:
                response = client.post(f'/api/auth/verify-email/', {'token': verification.token})
                print(f"   Verification response: {response.status_code}")
                if response.status_code == 200:
                    print("   ✅ Email verification successful")
                else:
                    print(f"   ❌ Verification failed: {response.content}")
            except Exception as e:
                print(f"   ❌ Verification error: {e}")

if __name__ == "__main__":
    try:
        # Test the email verification model and utilities
        user, verification = test_email_verification()
        
        # Test the API endpoints
        test_api_endpoints()
        
        print("\n🎉 Email verification system test completed!")
        print("\nNext steps:")
        print("1. Test the frontend registration form")
        print("2. Check email console output for verification emails")
        print("3. Test the complete user flow from registration to login")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
