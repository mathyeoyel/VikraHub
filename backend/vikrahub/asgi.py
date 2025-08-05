"""
ASGI config for vikrahub project with WebSocket support.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
import logging
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import re_path

# Set up logging
logger = logging.getLogger(__name__)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')

# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

# Import routing and JWT middleware after Django is initialized
import messaging.routing
from vikrahub.middleware import JWTAuthMiddlewareStack
from notifications.notification_consumer import NotificationConsumer

logger.info("ASGI: Configuring WebSocket routing with JWTAuthMiddleware")

# Combine all WebSocket routing patterns
websocket_urlpatterns = [
    # Messaging WebSocket routes
    *messaging.routing.websocket_urlpatterns,
    
    # Notification WebSocket routes
    re_path(r'ws/notifications/$', NotificationConsumer.as_asgi()),
]

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})
