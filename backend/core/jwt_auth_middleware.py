"""
JWT Authentication Middleware for Django Channels WebSocket connections.

This middleware validates JWT tokens passed as query parameters and sets the user
in the WebSocket scope for authenticated connections.
"""

import logging
from urllib.parse import parse_qs
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.db import close_old_connections
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
import jwt
from django.conf import settings

logger = logging.getLogger(__name__)
User = get_user_model()


@database_sync_to_async
def get_user_from_token(token):
    """
    Validate JWT token and return the associated user.
    
    Args:
        token (str): JWT token string
        
    Returns:
        User or AnonymousUser: The authenticated user or AnonymousUser if invalid
    """
    try:
        # Validate the token using rest_framework_simplejwt
        UntypedToken(token)
        
        # Decode the token to get user information
        decoded_data = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=["HS256"]
        )
        
        # Get user ID from token payload
        user_id = decoded_data.get('user_id')
        if not user_id:
            logger.warning("JWT token missing user_id")
            return AnonymousUser()
        
        # Get user from database
        user = User.objects.get(id=user_id)
        
        logger.info(f"WebSocket JWT authentication successful for user: {user.username}")
        return user
        
    except InvalidToken:
        logger.warning("Invalid JWT token provided for WebSocket connection")
        return AnonymousUser()
    except TokenError as e:
        logger.warning(f"JWT token error for WebSocket connection: {e}")
        return AnonymousUser()
    except User.DoesNotExist:
        logger.warning(f"User with ID {user_id} not found for WebSocket connection")
        return AnonymousUser()
    except Exception as e:
        logger.error(f"Unexpected error during WebSocket JWT authentication: {e}")
        return AnonymousUser()


class JWTAuthMiddleware:
    """
    Custom middleware to authenticate WebSocket connections using JWT tokens.
    
    The token should be passed as a query parameter: ws://example.com/ws/?token=<jwt_token>
    """
    
    def __init__(self, inner):
        self.inner = inner
    
    async def __call__(self, scope, receive, send):
        # Close old database connections to prevent usage of timed out connections
        close_old_connections()
        
        # Get the token from query string
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]
        
        if token:
            # Authenticate user with JWT token
            scope['user'] = await get_user_from_token(token)
            logger.info(f"WebSocket connection authenticated as: {scope['user']}")
        else:
            # No token provided, set as anonymous user
            scope['user'] = AnonymousUser()
            logger.info("WebSocket connection with no token, setting as AnonymousUser")
        
        # Call the next middleware/consumer
        return await self.inner(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    """
    Convenience function to create JWTAuthMiddleware.
    Can be used as a drop-in replacement for AuthMiddlewareStack.
    """
    return JWTAuthMiddleware(inner)
