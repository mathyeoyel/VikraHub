# backend/messaging/routing.py
from django.urls import re_path
from . import consumers
from .chat_consumer import ChatConsumer

websocket_urlpatterns = [
    re_path(r'ws/messaging/$', consumers.MessagingConsumer.as_asgi()),
    re_path(r'ws/chat/$', ChatConsumer.as_asgi()),
]
