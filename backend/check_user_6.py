#!/usr/bin/env python3
import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
django.setup()

from core.models import PortfolioItem, User

def check_user_6():
    print("=== User ID 6 Analysis ===\n")
    
    try:
        user = User.objects.get(id=6)
        print(f"User ID 6: {user.username}")
        
        items = PortfolioItem.objects.filter(user=user)
        print(f"Portfolio items: {items.count()}")
        
        for item in items:
            image_text = item.image if item.image else "None"
            print(f"  ID: {item.id} | Title: '{item.title}' | Image: '{image_text}'")
            
    except User.DoesNotExist:
        print("User ID 6 not found")
        
        # Check latest users
        latest_users = User.objects.all().order_by('-id')[:5]
        print("Latest users:")
        for user in latest_users:
            print(f"  ID: {user.id} | Username: {user.username}")
        
        # Check user ID range around 6
        print("\nUsers around ID 6:")
        for user_id in range(1, 10):
            try:
                user = User.objects.get(id=user_id)
                print(f"  ID: {user.id} | Username: {user.username}")
            except User.DoesNotExist:
                print(f"  ID: {user_id} | Not found")

if __name__ == "__main__":
    check_user_6()
