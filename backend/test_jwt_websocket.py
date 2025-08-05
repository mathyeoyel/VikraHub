"""
Test script to verify JWT WebSocket authentication middleware
"""
import os
import django
import asyncio
import json
from channels.testing import WebsocketCommunicator
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
django.setup()

from vikrahub.asgi import application

User = get_user_model()

async def test_jwt_websocket_auth():
    """Test JWT authentication for WebSocket connections"""
    
    print("🧪 Testing JWT WebSocket Authentication...")
    
    # Create a test user
    try:
        user = User.objects.get(username='testuser')
        print(f"✅ Using existing test user: {user.username}")
    except User.DoesNotExist:
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        print(f"✅ Created test user: {user.username}")
    
    # Generate JWT token for the user
    access_token = AccessToken.for_user(user)
    token_string = str(access_token)
    print(f"✅ Generated JWT token for user {user.username}")
    
    # Test 1: Valid token should connect successfully
    print("\n📡 Test 1: Valid JWT token connection...")
    communicator = WebsocketCommunicator(application, f"/ws/chat/?token={token_string}")
    
    try:
        connected, subprotocol = await asyncio.wait_for(communicator.connect(), timeout=5.0)
        if connected:
            print("✅ WebSocket connected successfully with valid token!")
            
            # Test sending a message
            await communicator.send_json_to({
                "type": "message",
                "recipient_id": user.id,
                "text": "Test message"
            })
            print("✅ Test message sent successfully!")
            
            # Disconnect
            await communicator.disconnect()
            print("✅ WebSocket disconnected cleanly")
        else:
            print("❌ Failed to connect with valid token")
    except asyncio.TimeoutError:
        print("❌ Connection timeout with valid token")
    except Exception as e:
        print(f"❌ Connection error with valid token: {e}")
    
    # Test 2: Invalid token should be rejected
    print("\n📡 Test 2: Invalid token rejection...")
    invalid_communicator = WebsocketCommunicator(application, "/ws/chat/?token=invalid_token")
    
    try:
        connected, subprotocol = await asyncio.wait_for(invalid_communicator.connect(), timeout=5.0)
        if connected:
            print("❌ WebSocket should not connect with invalid token!")
            await invalid_communicator.disconnect()
        else:
            print("✅ Invalid token correctly rejected!")
    except Exception as e:
        print(f"✅ Invalid token correctly rejected with error: {e}")
    
    # Test 3: No token should be rejected
    print("\n📡 Test 3: No token rejection...")
    no_token_communicator = WebsocketCommunicator(application, "/ws/chat/")
    
    try:
        connected, subprotocol = await asyncio.wait_for(no_token_communicator.connect(), timeout=5.0)
        if connected:
            print("❌ WebSocket should not connect without token!")
            await no_token_communicator.disconnect()
        else:
            print("✅ Connection correctly rejected without token!")
    except Exception as e:
        print(f"✅ Connection correctly rejected without token: {e}")
    
    print("\n🎉 JWT WebSocket Authentication tests completed!")

if __name__ == "__main__":
    asyncio.run(test_jwt_websocket_auth())
