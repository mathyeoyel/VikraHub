#!/usr/bin/env python
"""
Test script to verify email verification is working correctly
Run this after applying the fixes to test the registration flow
"""
import os
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
from core.models import EmailVerification

def test_registration_requires_verification():
    """Test that user registration creates inactive users requiring verification"""
    print("🧪 Testing Email Verification System")
    print("=" * 50)
    
    client = Client()
    
    # Test user registration
    print("1. Testing user registration...")
    registration_data = {
        'username': 'testuser123',
        'email': 'test@example.com',
        'password': 'testpassword123',
        'password2': 'testpassword123',
        'user_type': 'client'
    }
    
    try:
        response = client.post('/api/users/', registration_data)
        print(f"   Registration response status: {response.status_code}")
        
        if response.status_code == 201:
            response_data = json.loads(response.content)
            user_id = response_data.get('id')
            print(f"   ✅ User created with ID: {user_id}")
            
            # Check if user is inactive
            user = User.objects.get(id=user_id)
            print(f"   📧 User email: {user.email}")
            print(f"   🔒 User active status: {user.is_active}")
            
            if not user.is_active:
                print("   ✅ PASS: User is correctly inactive until verification")
            else:
                print("   ❌ FAIL: User is active without verification!")
                return False
            
            # Check if email verification was created
            verification = EmailVerification.objects.filter(user=user, is_verified=False).first()
            if verification:
                print(f"   📮 Verification token created: {verification.token}")
                print("   ✅ PASS: Email verification record created")
                
                # Test verification process
                print("\n2. Testing email verification...")
                verify_response = client.post('/api/users/verify-email/', {
                    'token': verification.token
                })
                print(f"   Verification response status: {verify_response.status_code}")
                
                if verify_response.status_code == 200:
                    # Check if user is now active
                    user.refresh_from_db()
                    verification.refresh_from_db()
                    
                    print(f"   🔓 User active after verification: {user.is_active}")
                    print(f"   ✅ Verification status: {verification.is_verified}")
                    
                    if user.is_active and verification.is_verified:
                        print("   ✅ PASS: Email verification working correctly!")
                        return True
                    else:
                        print("   ❌ FAIL: Verification didn't activate user!")
                        return False
                else:
                    print(f"   ❌ FAIL: Verification failed with status {verify_response.status_code}")
                    if hasattr(verify_response, 'content'):
                        print(f"   Error: {verify_response.content}")
                    return False
            else:
                print("   ❌ FAIL: No email verification record created")
                return False
        else:
            print(f"   ❌ FAIL: Registration failed with status {response.status_code}")
            if hasattr(response, 'content'):
                print(f"   Error: {response.content}")
            return False
            
    except Exception as e:
        print(f"   ❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        # Clean up test user
        try:
            User.objects.filter(email='test@example.com').delete()
            print("\n🧹 Test user cleaned up")
        except:
            pass

def check_settings():
    """Check if email verification settings are properly configured"""
    print("\n⚙️  Checking Email Verification Settings")
    print("=" * 50)
    
    from django.conf import settings
    
    # Check Django Allauth settings
    print(f"ACCOUNT_EMAIL_VERIFICATION: {getattr(settings, 'ACCOUNT_EMAIL_VERIFICATION', 'Not set')}")
    print(f"ACCOUNT_ADAPTER: {getattr(settings, 'ACCOUNT_ADAPTER', 'Not set')}")
    print(f"EMAIL_BACKEND: {getattr(settings, 'EMAIL_BACKEND', 'Not set')}")
    
    # Check if custom adapter exists
    try:
        from core.adapters import NoSignupAccountAdapter
        print("✅ Custom account adapter found")
    except ImportError:
        print("❌ Custom account adapter not found")
    
    # Check if EmailVerification model exists
    try:
        from core.models import EmailVerification
        count = EmailVerification.objects.count()
        print(f"✅ EmailVerification model working ({count} records)")
    except Exception as e:
        print(f"❌ EmailVerification model error: {e}")

if __name__ == "__main__":
    check_settings()
    success = test_registration_requires_verification()
    
    print(f"\n🎯 Email Verification Test Result: {'✅ PASSED' if success else '❌ FAILED'}")
    
    if success:
        print("\n🎉 Email verification is working correctly!")
        print("✅ Users are created as inactive")
        print("✅ Email verification tokens are generated")
        print("✅ Users are activated after email verification")
        print("✅ System is ready for production!")
    else:
        print("\n⚠️  Email verification needs attention:")
        print("1. Check Django settings configuration")
        print("2. Verify database migrations are applied")
        print("3. Ensure custom adapters are working")
        print("4. Test email sending in production")
