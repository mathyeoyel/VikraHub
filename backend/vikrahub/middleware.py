"""
JWT Authentication Middleware for Django Channels WebSocket connections.
Allows authentication via JWT token passed in query string.
"""

from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from django.db import close_old_connections
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from rest_framework_simplejwt.tokens import AccessToken, TokenError
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


@database_sync_to_async
def get_user_from_token(token_string):
    """
    Get user from JWT token string.
    
    Args:
        token_string (str): The JWT token string
        
    Returns:
        User or AnonymousUser: The authenticated user or AnonymousUser if invalid
    """
    try:
        # Decode and validate the access token
        access_token = AccessToken(token_string)
        
        # Get user ID from token
        user_id = access_token['user_id']
        
        # Fetch user from database
        user = User.objects.get(id=user_id)
        
        # Check if user is active
        if not user.is_active:
            logger.warning(f"Inactive user {user_id} attempted WebSocket connection")
            return AnonymousUser()
            
        logger.info(f"WebSocket authentication successful for user {user.username} (ID: {user_id})")
        return user
        
    except TokenError as e:
        logger.warning(f"Invalid JWT token in WebSocket connection: {e}")
        return AnonymousUser()
    except InvalidToken as e:
        logger.warning(f"Invalid JWT token format in WebSocket connection: {e}")
        return AnonymousUser()
    except User.DoesNotExist:
        logger.warning(f"User with ID {user_id} not found for WebSocket connection")
        return AnonymousUser()
    except Exception as e:
        logger.error(f"Unexpected error during WebSocket JWT authentication: {e}")
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Custom middleware for JWT authentication in Django Channels.
    
    Authenticates WebSocket connections using JWT tokens passed in query string.
    Expected format: ws://example.com/ws/path/?token=YOUR_ACCESS_TOKEN
    """

    async def __call__(self, scope, receive, send):
        """
        Authenticate the WebSocket connection using JWT token from query string.
        
        Args:
            scope (dict): The ASGI scope
            receive (callable): The receive callable
            send (callable): The send callable
            
        Returns:
            The result of calling the inner application
        """
        # Close old database connections to prevent usage of timed out connections
        close_old_connections()
        
        # Initialize user as anonymous
        scope['user'] = AnonymousUser()
        
        # Only process WebSocket connections
        if scope['type'] == 'websocket':
            # Get query string from scope
            query_string = scope.get('query_string', b'').decode('utf-8')
            
            # Parse query parameters
            query_params = {}
            if query_string:
                for param in query_string.split('&'):
                    if '=' in param:
                        key, value = param.split('=', 1)
                        query_params[key] = value
            
            # Extract token from query parameters
            token = query_params.get('token')
            
            if token:
                logger.debug(f"JWT token found in WebSocket query string")
                # Authenticate user with token
                user = await get_user_from_token(token)
                scope['user'] = user
                
                if not isinstance(user, AnonymousUser):
                    logger.info(f"WebSocket connection authenticated for user: {user.username}")
                else:
                    logger.warning("WebSocket connection failed authentication - invalid token")
            else:
                logger.warning("WebSocket connection attempted without token parameter")
        
        # Call the next middleware/consumer
        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    """
    Convenience function to create JWT auth middleware stack.
    
    Args:
        inner: The inner ASGI application
        
    Returns:
        The middleware-wrapped application
    """
    return JWTAuthMiddleware(inner)
