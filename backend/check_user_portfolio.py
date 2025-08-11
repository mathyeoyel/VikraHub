#!/usr/bin/env python3
import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
django.setup()

from core.models import PortfolioItem, User

def check_mathyeoyel_portfolio():
    print("=== mathyeoyel Portfolio Analysis ===\n")
    
    try:
        user = User.objects.get(username='mathyeoyel')
        print(f"User: {user.username} (ID: {user.id})")
        
        items = PortfolioItem.objects.filter(user=user)
        print(f"Portfolio items count: {items.count()}")
        
        for item in items:
            image_text = item.image if item.image else "No image"
            print(f"  ID: {item.id} | Title: '{item.title}' | Image: '{image_text}'")
            
        # Also check all portfolio items to see who owns what
        print(f"\n=== All Portfolio Items ===")
        all_items = PortfolioItem.objects.all()
        for item in all_items:
            image_text = item.image if item.image else "No image"
            owner = item.user.username if item.user else "No owner"
            print(f"  ID: {item.id} | Owner: {owner} | Title: '{item.title}' | Image: '{image_text}'")
            
    except User.DoesNotExist:
        print("User 'mathyeoyel' not found")

if __name__ == "__main__":
    check_mathyeoyel_portfolio()
