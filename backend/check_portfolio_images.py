#!/usr/bin/env python3
import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
django.setup()

from core.models import PortfolioItem, User

def check_portfolio_images():
    print("=== Portfolio Images Analysis ===\n")
    
    # Get all portfolio items
    items = PortfolioItem.objects.all()
    print(f"📊 Total portfolio items: {items.count()}")
    
    # Check image field values
    items_with_images = items.exclude(image__isnull=True).exclude(image__exact='')
    items_without_images = items.filter(image__isnull=True) | items.filter(image__exact='')
    
    print(f"✅ Items with images: {items_with_images.count()}")
    print(f"❌ Items without images: {items_without_images.count()}")
    
    print("\n=== Items with Images ===")
    for item in items_with_images:
        print(f"ID: {item.id} | Title: '{item.title}' | Image: '{item.image[:100]}...' | User: {item.user}")
    
    print("\n=== Items without Images ===")
    for item in items_without_images:
        print(f"ID: {item.id} | Title: '{item.title}' | Image: '{item.image}' | User: {item.user}")
    
    print(f"\n=== User Analysis ===")
    users_with_portfolios = User.objects.filter(portfolio_items__isnull=False).distinct()
    print(f"👥 Users with portfolio items: {users_with_portfolios.count()}")
    
    for user in users_with_portfolios:
        user_items = user.portfolio_items.all()
        print(f"User: {user.username} ({user.id}) - {user_items.count()} items")
        for item in user_items:
            has_image = "✅" if item.image else "❌"
            print(f"  {has_image} {item.title}")

if __name__ == "__main__":
    check_portfolio_images()
