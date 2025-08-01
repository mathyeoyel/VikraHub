import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
django.setup()

from core.models import PortfolioItem

print("Comprehensive search for problematic portfolio items...")

# Get all items and check their image values more thoroughly
all_items = PortfolioItem.objects.all()
print(f"Total portfolio items: {all_items.count()}")
print("=" * 50)

for item in all_items:
    print(f"ID: {item.id}")
    print(f"Title: '{item.title}'")
    print(f"Description: '{item.description[:100]}...' " if len(item.description) > 100 else f"Description: '{item.description}'")
    print(f"Image: '{item.image}'")
    print(f"URL: '{item.url}'")
    print(f"Tags: '{item.tags}'")
    print(f"Date: {item.date}")
    print(f"User: {item.user}")
    
    # Check for various problematic patterns
    if item.image:
        if 'W.png' in item.image or 'w.png' in item.image:
            print(f"  🚨 FOUND W.PNG REFERENCE!")
        elif item.image.endswith('.png') and not item.image.startswith('http'):
            print(f"  ⚠️  Local PNG file detected: {item.image}")
        elif not item.image.startswith('http') and not item.image.startswith('/'):
            print(f"  ⚠️  Relative path detected: {item.image}")
    else:
        print(f"  ℹ️  No image")
    
    print("-" * 30)

# Also check if there are any items that might cause the createPortfolioImageUrl to generate portfolio/W.png
print("\nChecking for items that might generate portfolio/W.png path...")
for item in all_items:
    if item.image == 'W.png' or item.image == 'w.png':
        print(f"  🚨 Found direct W.png reference in item {item.id}: '{item.title}'")
        print(f"     This would generate: portfolio/W.png")
        print(f"     RECOMMENDATION: Delete this item")
        
print("\nDone!")
