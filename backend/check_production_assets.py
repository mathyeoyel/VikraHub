#!/usr/bin/env python3
"""
Check production assets - this script will be uploaded to production to diagnose the issue
"""
import os
import sys
import django
import requests
from datetime import datetime, timedelta

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import CreativeAsset, AssetCategory
from django.db import connection

User = get_user_model()

def check_production_assets():
    """Check assets in production database"""
    print("🔍 Checking Production Assets")
    print("=" * 50)
    print(f"📅 Current time: {datetime.now()}")
    
    # Check database connection
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        print("✅ Database connection successful")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return
    
    # Check total assets
    total_assets = CreativeAsset.objects.count()
    print(f"📊 Total assets in database: {total_assets}")
    
    # Check recent assets (last 7 days)
    week_ago = datetime.now() - timedelta(days=7)
    recent_assets = CreativeAsset.objects.filter(created_at__gte=week_ago).order_by('-created_at')
    print(f"📅 Assets created in last 7 days: {recent_assets.count()}")
    
    # Show all assets with details
    print(f"\n📋 All Assets in Database:")
    all_assets = CreativeAsset.objects.all().order_by('-created_at')
    
    if all_assets.exists():
        for asset in all_assets:
            print(f"  ID: {asset.id}")
            print(f"  Title: {asset.title}")
            print(f"  Seller: {asset.seller.username}")
            print(f"  Created: {asset.created_at}")
            print(f"  Category: {asset.category.name if asset.category else 'No category'}")
            print(f"  Price: {asset.price} {asset.currency}")
            print(f"  Preview: {asset.preview_image}")
            print(f"  Files: {asset.asset_files}")
            print("  " + "-" * 40)
    else:
        print("  No assets found in database")
    
    # Check recent users
    print(f"\n👥 Recent Users (last 7 days):")
    recent_users = User.objects.filter(date_joined__gte=week_ago).order_by('-date_joined')
    print(f"New users in last 7 days: {recent_users.count()}")
    
    for user in recent_users[:10]:  # Show first 10
        print(f"  - {user.username} (joined: {user.date_joined})")
    
    # Check categories
    categories = AssetCategory.objects.all()
    print(f"\n📂 Available categories: {categories.count()}")
    
    # Check for any database errors or constraints
    print(f"\n🔧 Database Table Info:")
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM core_creativeasset")
            db_count = cursor.fetchone()[0]
            print(f"Direct SQL count: {db_count}")
            
            # Check table structure
            cursor.execute("PRAGMA table_info(core_creativeasset)")
            columns = cursor.fetchall()
            print(f"Table has {len(columns)} columns")
            
    except Exception as e:
        print(f"❌ Database query error: {e}")
    
    print("\n" + "=" * 50)
    print("🔚 Production check completed")

if __name__ == "__main__":
    check_production_assets()
