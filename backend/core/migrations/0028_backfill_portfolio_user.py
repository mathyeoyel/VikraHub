# Generated migration for backfilling portfolio user field

from django.db import migrations
from django.contrib.auth.models import User


def backfill_portfolio_user(apps, schema_editor):
    """
    Backfill the user field for any PortfolioItem records that don't have a user.
    Sets them to the first admin user or creates a default user if needed.
    """
    PortfolioItem = apps.get_model('core', 'PortfolioItem')
    User = apps.get_model('auth', 'User')
    
    # Get items without a user
    items_without_user = PortfolioItem.objects.filter(user__isnull=True)
    
    if items_without_user.exists():
        # Try to get the first admin user
        admin_user = User.objects.filter(is_staff=True).first()
        
        if not admin_user:
            # Create a default admin user if none exists
            admin_user = User.objects.create_user(
                username='admin',
                email='admin@vikrahub.com',
                is_staff=True,
                is_superuser=True
            )
            admin_user.set_password('admin123')
            admin_user.save()
        
        # Update all items without a user
        items_without_user.update(user=admin_user)
        print(f"Backfilled {items_without_user.count()} portfolio items with user: {admin_user.username}")


def reverse_backfill_portfolio_user(apps, schema_editor):
    """
    Reverse migration - set user field back to null for backfilled items.
    This is not perfect but better than nothing.
    """
    # Since we can't perfectly determine which items were backfilled,
    # we'll just pass - in practice this migration should not be reversed
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0027_update_portfolio_related_name'),
    ]

    operations = [
        migrations.RunPython(
            backfill_portfolio_user,
            reverse_backfill_portfolio_user,
        ),
    ]
