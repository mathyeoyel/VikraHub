#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
django.setup()

from core.models import CreativeAsset
from django.contrib.auth.models import User

print("=== Checking Creative Assets ===")
total_assets = CreativeAsset.objects.count()
print(f"Total assets in database: {total_assets}")

if total_assets > 0:
    print("\nAssets found:")
    for asset in CreativeAsset.objects.all():
        print(f"- ID: {asset.id}")
        print(f"  Title: {asset.title}")
        print(f"  Seller: {asset.seller.username}")
        print(f"  Created: {asset.created_at}")
        print(f"  Price: ${asset.price}")
        print(f"  Status: {'Active' if asset.is_active else 'Inactive'}")
        print()
else:
    print("No assets found in database")

print("=== Checking Users ===")
mathew = User.objects.filter(username='mathewyel').first()
if mathew:
    print(f"Mathew Yel found (ID: {mathew.id})")
    mathew_assets = CreativeAsset.objects.filter(seller=mathew)
    print(f"Mathew's assets: {mathew_assets.count()}")
else:
    print("Mathew Yel not found")
    print("Available users:")
    for user in User.objects.all():
        print(f"- {user.username} (ID: {user.id})")
