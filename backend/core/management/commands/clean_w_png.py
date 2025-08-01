from django.core.management.base import BaseCommand
from django.db import models
from core.models import PortfolioItem

class Command(BaseCommand):
    help = 'Remove portfolio items with W.png references'

    def handle(self, *args, **options):
        # Find items with W.png
        w_png_items = PortfolioItem.objects.filter(
            models.Q(image__icontains='W.png') | 
            models.Q(image__icontains='w.png') |
            models.Q(image='W.png') |
            models.Q(image='w.png')
        )
        
        count = w_png_items.count()
        
        if count > 0:
            self.stdout.write(f"Found {count} portfolio items with W.png references:")
            for item in w_png_items:
                self.stdout.write(f"  - ID: {item.id}, Title: '{item.title}', Image: '{item.image}'")
            
            if input("Delete these items? (y/N): ").lower() == 'y':
                w_png_items.delete()
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully deleted {count} portfolio items with W.png references')
                )
            else:
                self.stdout.write("Operation cancelled")
        else:
            self.stdout.write(
                self.style.SUCCESS('No portfolio items with W.png references found')
            )
