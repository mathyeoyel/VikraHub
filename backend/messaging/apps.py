# backend/messaging/apps.py
from django.apps import AppConfig


class MessagingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'messaging'
    verbose_name = 'Messaging System'
    
    def ready(self):
        """Import signals when the app is ready"""
        # Import any signals if needed in the future
        pass
