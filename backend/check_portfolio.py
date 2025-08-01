import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
django.setup()

from core.models import PortfolioItem

items = PortfolioItem.objects.all()
print(f'Total portfolio items: {items.count()}')
print('All portfolio items:')
for item in items:
    print(f'ID: {item.id}, Title: "{item.title}", Image: "{item.image}"')

# Check for any items with W.png specifically
w_items = PortfolioItem.objects.filter(image__icontains='W.png')
print(f'\nItems containing W.png: {w_items.count()}')
for item in w_items:
    print(f'Found: ID {item.id}, Title: "{item.title}", Image: "{item.image}"')
