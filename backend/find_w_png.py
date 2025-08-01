import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
django.setup()

from core.models import PortfolioItem

print("Searching for W.png references in portfolio items...")

# Search for items with W.png in various ways
items_with_w = PortfolioItem.objects.filter(image__icontains='W.png')
items_with_w_lower = PortfolioItem.objects.filter(image__icontains='w.png')
items_with_portfolio_path = PortfolioItem.objects.filter(image__icontains='portfolio/W')

print(f"Items with 'W.png': {items_with_w.count()}")
print(f"Items with 'w.png': {items_with_w_lower.count()}")
print(f"Items with 'portfolio/W': {items_with_portfolio_path.count()}")

# Get all items and check their image values
all_items = PortfolioItem.objects.all()
print(f"\nAll portfolio items ({all_items.count()}):")
for item in all_items:
    image_value = item.image or "(empty)"
    print(f"ID: {item.id} | Title: '{item.title}' | Image: '{image_value}'")
    
    # Check if image contains any reference to W.png
    if item.image and ('W.png' in item.image or 'w.png' in item.image):
        print(f"  ⚠️  FOUND W.PNG REFERENCE: {item.image}")
        
        # Ask if we should delete this item
        print(f"  This item (ID: {item.id}, Title: '{item.title}') contains W.png reference.")
        print(f"  Image path: '{item.image}'")
        print(f"  This item should be deleted to fix the 404 error.")
