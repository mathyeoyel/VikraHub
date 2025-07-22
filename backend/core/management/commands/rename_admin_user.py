from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
import os

class Command(BaseCommand):
    help = 'Rename the admin user'

    def add_arguments(self, parser):
        parser.add_argument('--old-username', type=str, default='admin', help='Current username to rename')
        parser.add_argument('--new-username', type=str, required=True, help='New username')
        parser.add_argument('--new-email', type=str, help='New email (optional)')

    def handle(self, *args, **options):
        old_username = options['old_username']
        new_username = options['new_username']
        new_email = options.get('new_email')
        
        try:
            user = User.objects.get(username=old_username)
            user.username = new_username
            if new_email:
                user.email = new_email
            user.save()
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully renamed user from "{old_username}" to "{new_username}"')
            )
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'User "{old_username}" does not exist')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error renaming user: {e}')
            )
