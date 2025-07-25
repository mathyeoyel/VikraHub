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
    logger.info(f"get_user_from_token: Starting validation for token: {token[:20]}...{token[-10:] if len(token) > 30 else token}")
    
    try:
        # Validate the token using rest_framework_simplejwt
        logger.info("get_user_from_token: Validating token with UntypedToken...")
        UntypedToken(token)
        logger.info("get_user_from_token: Token validation successful")
        
        # Decode the token to get user information
        logger.info("get_user_from_token: Decoding token payload...")
        decoded_data = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=["HS256"]
        )
        logger.info(f"get_user_from_token: Decoded payload: {decoded_data}")
        
        # Get user ID from token payload
        user_id = decoded_data.get('user_id')
        logger.info(f"get_user_from_token: Extracted user_id: {user_id}")
        
        if not user_id:
            logger.warning("get_user_from_token: JWT token missing user_id")
            return AnonymousUser()
        
        # Get user from database
        logger.info(f"get_user_from_token: Looking up user with ID: {user_id}")
        user = User.objects.get(id=user_id)
        logger.info(f"get_user_from_token: Found user: {user.username} (ID: {user.id})")
        
        logger.info(f"get_user_from_token: WebSocket JWT authentication successful for user: {user.username}")
        return user
        
    except InvalidToken as e:
        logger.warning(f"get_user_from_token: Invalid JWT token: {e}")
        return AnonymousUser()
    except TokenError as e:
        logger.warning(f"get_user_from_token: JWT token error: {e}")
        return AnonymousUser()
    except User.DoesNotExist:
        logger.warning(f"get_user_from_token: User with ID {user_id} not found")
        return AnonymousUser()
    except Exception as e:
        logger.error(f"get_user_from_token: Unexpected error during JWT authentication: {e}")
        logger.exception("Full exception details:")
        return AnonymousUser()


class JWTAuthMiddleware:
    """
    Custom middleware to authenticate WebSocket connections using JWT tokens.
    
    The token should be passed as a query parameter: ws://example.com/ws/?token=<jwt_token>
    """
    
    def __init__(self, inner):
        self.inner = inner
    
    async def __call__(self, scope, receive, send):
        logger.info("=== JWTAuthMiddleware: Processing WebSocket connection ===")
        
        # Close old database connections to prevent usage of timed out connections
        close_old_connections()
        
        # Get the token from query string
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]
        
        logger.info(f"JWTAuthMiddleware: Query string: {query_string}")
        logger.info(f"JWTAuthMiddleware: Token present: {bool(token)}")
        if token:
            logger.info(f"JWTAuthMiddleware: Token preview: {token[:20]}...{token[-10:] if len(token) > 30 else token}")
        
        if token:
            # Authenticate user with JWT token
            scope['user'] = await get_user_from_token(token)
            logger.info(f"JWTAuthMiddleware: Authenticated user: {scope['user']}")
            logger.info(f"JWTAuthMiddleware: User type: {type(scope['user'])}")
            logger.info(f"JWTAuthMiddleware: Is anonymous: {scope['user'].is_anonymous if hasattr(scope['user'], 'is_anonymous') else 'No is_anonymous attr'}")
        else:
            # No token provided, set as anonymous user
            scope['user'] = AnonymousUser()
            logger.info("JWTAuthMiddleware: No token provided, setting as AnonymousUser")
        
        logger.info(f"JWTAuthMiddleware: Final scope['user']: {scope['user']}")
        logger.info("=== JWTAuthMiddleware: Processing complete ===")
        
        # Call the next middleware/consumer
        return await self.inner(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    """
    Convenience function to create JWTAuthMiddleware.
    Can be used as a drop-in replacement for AuthMiddlewareStack.
    """
    return JWTAuthMiddleware(inner)
