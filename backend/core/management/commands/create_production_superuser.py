from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.conf import settings
import os

class Command(BaseCommand):
    help = 'Create a superuser for production deployment'

    def handle(self, *args, **options):
        username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
        email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@vikrahub.com')
        password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'VikraHub2025Admin!')
        
        if not User.objects.filter(username=username).exists():
            User.objects.create_superuser(
                username=username,
                email=email,
                password=password
            )
            self.stdout.write(
                self.style.SUCCESS(f'Successfully created superuser: {username}')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'Superuser {username} already exists')
            )
