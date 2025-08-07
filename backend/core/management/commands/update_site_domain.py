# backend/core/management/commands/update_site_domain.py
from django.core.management.base import BaseCommand
from django.contrib.sites.models import Site


class Command(BaseCommand):
    help = 'Update Django Site domain to vikrahub.com'

    def handle(self, *args, **options):
        try:
            site = Site.objects.get_current()
            old_domain = site.domain
            old_name = site.name
            
            site.domain = 'vikrahub.com'
            site.name = 'VikraHub'
            site.save()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully updated site:\n'
                    f'Domain: {old_domain} → {site.domain}\n'
                    f'Name: {old_name} → {site.name}'
                )
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Failed to update site: {e}')
            )
