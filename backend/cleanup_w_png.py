import os
import django
from django.db import models

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
django.setup()

from core.models import PortfolioItem

print("🔍 Searching for and removing W.png portfolio items...")
print("=" * 60)

# Search for items with W.png references
w_png_items = PortfolioItem.objects.filter(
    models.Q(image__icontains='W.png') | 
    models.Q(image__icontains='w.png') |
    models.Q(image='W.png') |
    models.Q(image='w.png')
)

# Also search for items that are just filenames that might become W.png
filename_items = PortfolioItem.objects.filter(image__regex=r'^[^/]*\.png$')

print(f"Items with W.png references: {w_png_items.count()}")
print(f"Items with suspicious PNG filenames: {filename_items.count()}")

all_suspicious_items = list(w_png_items) + [item for item in filename_items if item not in w_png_items]

if all_suspicious_items:
    print(f"\n🚨 Found {len(all_suspicious_items)} suspicious portfolio items:")
    print("=" * 60)
    
    for item in all_suspicious_items:
        print(f"ID: {item.id}")
        print(f"Title: '{item.title}'")
        print(f"Image: '{item.image}'")
        print(f"User: {item.user}")
        print(f"Date: {item.date}")
        
        # Check if this would cause the W.png issue
        if item.image in ['W.png', 'w.png']:
            print("🎯 THIS IS THE CULPRIT! This item causes portfolio/W.png requests")
        elif 'W.png' in item.image:
            print("🚨 Contains W.png reference")
        elif item.image and not item.image.startswith('http') and item.image.endswith('.png'):
            print("⚠️  Suspicious local PNG that might cause issues")
            
        print("-" * 40)
    
    print("\n🗑️  CLEANUP OPTIONS:")
    print("1. Delete all suspicious items automatically")
    print("2. List items for manual review")
    print("3. Just show the problematic ones")
    
    # For safety, let's just show what we found first
    print("\n📋 RECOMMENDED ACTION:")
    print("Review the items above and decide which ones to delete.")
    print("Run the following commands to delete specific items:")
    
    for item in all_suspicious_items:
        if item.image in ['W.png', 'w.png'] or 'W.png' in str(item.image):
            print(f"# Delete item causing W.png issue:")
            print(f"PortfolioItem.objects.filter(id={item.id}).delete()")
    
else:
    print("✅ No suspicious portfolio items found in local database!")
    print("The W.png issue might be:")
    print("1. In the production database")
    print("2. Browser cache")
    print("3. Old build cache")
    
print("\n" + "=" * 60)
print("🎯 NEXT STEPS:")
print("1. Clear browser cache (Ctrl+Shift+Delete)")
print("2. Rebuild frontend (npm run build)")
print("3. If issue persists, the W.png item is in production database")
print("4. Access production Django admin to delete the item there")
