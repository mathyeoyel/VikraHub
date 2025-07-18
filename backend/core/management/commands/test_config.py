from django.core.management.base import BaseCommand
from django.conf import settings
import os

class Command(BaseCommand):
    help = 'Test the Django configuration and environment variables'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== Django Configuration Test ==='))
        
        # Test basic Django settings
        self.stdout.write(f'DEBUG: {settings.DEBUG}')
        self.stdout.write(f'SECRET_KEY configured: {"Yes" if settings.SECRET_KEY else "No"}')
        self.stdout.write(f'ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}')
        
        # Test database configuration
        db_url = os.environ.get('DATABASE_URL')
        self.stdout.write(f'DATABASE_URL configured: {"Yes" if db_url else "No"}')
        
        # Test Cloudinary configuration
        cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME')
        api_key = os.environ.get('CLOUDINARY_API_KEY')
        api_secret = os.environ.get('CLOUDINARY_API_SECRET')
        
        self.stdout.write(f'CLOUDINARY_CLOUD_NAME: {cloud_name or "Not set"}')
        self.stdout.write(f'CLOUDINARY_API_KEY: {api_key or "Not set"}')
        self.stdout.write(f'CLOUDINARY_API_SECRET: {"Set" if api_secret else "Not set"}')
        
        # Test CORS configuration
        self.stdout.write(f'CORS_ALLOW_ALL_ORIGINS: {settings.CORS_ALLOW_ALL_ORIGINS}')
        
        # Test if we can import the core app
        try:
            from core.models import UserProfile
            self.stdout.write(self.style.SUCCESS('✓ Core app models imported successfully'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Core app import failed: {e}'))
        
        # Test database connection
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                self.stdout.write(self.style.SUCCESS('✓ Database connection successful'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Database connection failed: {e}'))
        
        self.stdout.write(self.style.SUCCESS('=== Configuration test completed ==='))
