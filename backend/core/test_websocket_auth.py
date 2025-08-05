"""
Test JWT WebSocket Authentication Middleware
"""
from django.test import TestCase
from django.contrib.auth.models import User, AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from vikrahub.middleware import JWTAuthMiddleware
import asyncio
from urllib.parse import quote


class JWTWebSocketAuthTestCase(TestCase):
    """Test JWT authentication for WebSocket connections."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_jwt_auth_middleware_valid_token(self):
        """Test that valid JWT token authenticates user."""
        async def run_test():
            # Generate JWT token
            token = AccessToken.for_user(self.user)
            
            # Create mock scope with token
            scope = {
                'type': 'websocket',
                'path': '/ws/chat/',
                'query_string': f'token={str(token)}'.encode(),
                'user': AnonymousUser()
            }
            
            # Create middleware instance
            middleware = JWTAuthMiddleware(lambda scope: scope)
            
            # Process the scope
            new_scope = await middleware(scope)
            
            # Check if user was properly set
            self.assertEqual(new_scope['user'].id, self.user.id)
            self.assertFalse(new_scope['user'].is_anonymous)
        
        # Run the async test
        asyncio.run(run_test())
    
    def test_jwt_auth_middleware_invalid_token(self):
        """Test that invalid JWT token results in anonymous user."""
        async def run_test():
            # Create mock scope with invalid token
            scope = {
                'type': 'websocket',
                'path': '/ws/chat/',
                'query_string': b'token=invalid_token',
                'user': AnonymousUser()
            }
            
            # Create middleware instance
            middleware = JWTAuthMiddleware(lambda scope: scope)
            
            # Process the scope
            new_scope = await middleware(scope)
            
            # Check if user remains anonymous
            self.assertTrue(new_scope['user'].is_anonymous)
        
        # Run the async test
        asyncio.run(run_test())
    
    def test_jwt_auth_middleware_no_token(self):
        """Test that missing token results in anonymous user."""
        async def run_test():
            # Create mock scope without token
            scope = {
                'type': 'websocket',
                'path': '/ws/chat/',
                'query_string': b'',
                'user': AnonymousUser()
            }
            
            # Create middleware instance
            middleware = JWTAuthMiddleware(lambda scope: scope)
            
            # Process the scope
            new_scope = await middleware(scope)
            
            # Check if user remains anonymous
            self.assertTrue(new_scope['user'].is_anonymous)
        
        # Run the async test
        asyncio.run(run_test())


