from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import PortfolioItem

class Command(BaseCommand):
    help = 'Fix portfolio item ownership by assigning orphaned items to the first user'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--user-id',
            type=int,
            help='Specific user ID to assign orphaned portfolio items to',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without making changes',
        )
    
    def handle(self, *args, **options):
        # Find portfolio items without a user
        orphaned_items = PortfolioItem.objects.filter(user__isnull=True)
        
        if not orphaned_items.exists():
            self.stdout.write(
                self.style.SUCCESS('No orphaned portfolio items found!')
            )
            return
        
        self.stdout.write(f'Found {orphaned_items.count()} orphaned portfolio items:')
        for item in orphaned_items:
            self.stdout.write(f'  - ID: {item.id}, Title: "{item.title}"')
        
        # Determine which user to assign to
        user_id = options.get('user_id')
        if user_id:
            try:
                target_user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'User with ID {user_id} does not exist!')
                )
                return
        else:
            # Default to the first user (usually the admin or first registered user)
            target_user = User.objects.first()
            if not target_user:
                self.stdout.write(
                    self.style.ERROR('No users found in the database!')
                )
                return
        
        self.stdout.write(f'Target user: {target_user.username} (ID: {target_user.id})')
        
        if options['dry_run']:
            self.stdout.write(
                self.style.WARNING('DRY RUN: Would assign all orphaned items to this user')
            )
            return
        
        # Update the orphaned items
        updated_count = orphaned_items.update(user=target_user)
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully assigned {updated_count} portfolio items to user {target_user.username}'
            )
        )
