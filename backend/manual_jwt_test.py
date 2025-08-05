"""
Simple JWT WebSocket Test - Manual verification
"""
import os
import django
import sys

# Add the project root to the Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import AccessToken
from urllib.parse import parse_qs

def test_jwt_middleware():
    """Test JWT middleware functionality manually."""
    
    print("🧪 Testing JWT WebSocket Authentication Middleware\n")
    
    # Create test user
    try:
        user = User.objects.get(username='testuser')
        print(f"✅ Found existing test user: {user.username}")
    except User.DoesNotExist:
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        print(f"✅ Created test user: {user.username}")
    
    # Generate JWT token
    token = AccessToken.for_user(user)
    print(f"✅ Generated JWT token: {str(token)[:20]}...")
    
    # Simulate middleware token parsing
    from vikrahub.middleware import get_user_from_token
    import asyncio
    
    async def test_token_validation():
        print("\n🔍 Testing token validation:")
        
        # Test valid token
        valid_user = await get_user_from_token(str(token))
        if valid_user and valid_user.id == user.id:
            print("✅ Valid token correctly authenticates user")
        else:
            print("❌ Valid token failed to authenticate user")
        
        # Test invalid token
        invalid_user = await get_user_from_token("invalid_token_here")
        print(f"Debug: Invalid token returned: {invalid_user}, type: {type(invalid_user)}")
        if invalid_user is None or (hasattr(invalid_user, 'is_anonymous') and invalid_user.is_anonymous):
            print("✅ Invalid token correctly returns None/AnonymousUser")
        else:
            print("❌ Invalid token incorrectly authenticated a user")
        
        # Test empty token
        empty_user = await get_user_from_token("")
        print(f"Debug: Empty token returned: {empty_user}, type: {type(empty_user)}")
        if empty_user is None or (hasattr(empty_user, 'is_anonymous') and empty_user.is_anonymous):
            print("✅ Empty token correctly returns None/AnonymousUser")
        else:
            print("❌ Empty token incorrectly authenticated a user")
    
    # Run async test
    asyncio.run(test_token_validation())
    
    print("\n🎯 Manual WebSocket Test Instructions:")
    print("1. Start the Django development server:")
    print("   python manage.py runserver")
    print("2. Use browser dev tools or WebSocket client to connect:")
    print(f"   ws://localhost:8000/ws/chat/?token={str(token)}")
    print("3. Check server logs for successful authentication")
    print("4. Try connecting without token or with invalid token to verify rejection")
    
    print("\n🚀 Production Test:")
    print("   Frontend should automatically connect with JWT token from login")
    print("   Check browser console for WebSocket connection status")
    
    return True

if __name__ == '__main__':
    test_jwt_middleware()
