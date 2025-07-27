#!/usr/bin/env python3
"""
Test script to debug asset upload issue
"""
import os
import sys
import django
import requests
import json

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import CreativeAsset, AssetCategory
from django.test import Client

User = get_user_model()

def test_api_upload(user, category):
    """Test uploading via the actual API endpoint"""
    print("🔌 Testing API Upload Endpoint")
    print("-" * 30)
    
    api_base_url = "http://127.0.0.1:8000/api/"
    
    # First, get authentication token
    try:
        # We need to create a user with a known password for API testing
        test_username = "api_test_user"
        test_password = "testpass123"
        
        # Check if test user exists, create if not
        try:
            api_user = User.objects.get(username=test_username)
            print(f"👤 Using existing API test user: {api_user.username}")
        except User.DoesNotExist:
            api_user = User.objects.create_user(
                username=test_username,
                email="apitest@example.com",
                password=test_password
            )
            print(f"👤 Created new API test user: {api_user.username}")
        
        # Login to get token
        login_data = {
            "username": test_username,
            "password": test_password
        }
        
        login_response = requests.post(
            f"{api_base_url}auth/token/",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        if login_response.status_code == 200:
            token_data = login_response.json()
            access_token = token_data.get('access')
            print(f"✅ Got access token: {access_token[:20]}...")
            
            # Now test asset creation
            asset_data = {
                "title": "API Test Asset",
                "description": "Testing asset upload via API",
                "category_id": category.id if category else 1,
                "asset_type": "graphic",
                "price": 15.00,
                "currency": "USD",
                "preview_image": "https://res.cloudinary.com/dxpwtdjzp/image/upload/v1234567890/test_api_upload.jpg",
                "tags": "api, test, upload"
            }
            
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            print(f"📤 Sending asset creation request...")
            create_response = requests.post(
                f"{api_base_url}creative-assets/",
                json=asset_data,
                headers=headers
            )
            
            print(f"📊 Response status: {create_response.status_code}")
            print(f"📋 Response headers: {dict(create_response.headers)}")
            
            if create_response.status_code in [200, 201]:
                response_data = create_response.json()
                print(f"✅ Asset created successfully via API!")
                print(f"   Asset ID: {response_data.get('id')}")
                print(f"   Asset title: {response_data.get('title')}")
                
                # Verify in database
                final_count = CreativeAsset.objects.count()
                print(f"📊 Total assets in database now: {final_count}")
                
            else:
                print(f"❌ Asset creation failed!")
                print(f"   Response: {create_response.text}")
                
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"   Response: {login_response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to Django server. Make sure it's running on http://127.0.0.1:8000")
    except Exception as e:
        print(f"❌ API test error: {e}")

def test_asset_upload():
    """Test asset upload functionality"""
    print("🔍 Testing Asset Upload Functionality")
    print("=" * 50)
    
    # Check current assets in database
    assets = CreativeAsset.objects.all()
    print(f"📊 Current assets in database: {assets.count()}")
    for asset in assets:
        print(f"  - {asset.title} by {asset.seller.username} (ID: {asset.id})")
    
    # Check categories
    categories = AssetCategory.objects.all()
    print(f"\n📂 Available categories: {categories.count()}")
    for cat in categories:
        print(f"  - {cat.name} (ID: {cat.id})")
    
    # Check users
    users = User.objects.all()
    print(f"\n👥 Available users: {users.count()}")
    for user in users[:5]:  # Show first 5 users
        print(f"  - {user.username} (ID: {user.id})")
    
    # Test API endpoint directly
    print(f"\n🌐 Testing API endpoint...")
    
    # First, let's test if we can get a token
    api_url = "http://127.0.0.1:8000/api/"
    
    # Try to login and get a token
    if users.exists():
        test_user = users.first()
        print(f"👤 Using test user: {test_user.username}")
        
        # Check if this user has assets
        user_assets = CreativeAsset.objects.filter(seller=test_user)
        print(f"   User's assets: {user_assets.count()}")
        
        # Try to create asset directly in Django
        try:
            if categories.exists():
                test_category = categories.first()
                print(f"📂 Using test category: {test_category.name}")
                
                test_asset_data = {
                    'title': 'Test Asset Upload Via Script',
                    'description': 'This is a test asset to debug upload issues',
                    'seller': test_user,
                    'category': test_category,
                    'asset_type': 'graphic',
                    'price': 10.00,
                    'currency': 'USD',
                    'preview_image': 'https://res.cloudinary.com/test/image/upload/test.jpg',
                    'tags': 'test, debug',
                }
                
                # Create asset directly
                new_asset = CreativeAsset.objects.create(**test_asset_data)
                print(f"✅ Successfully created test asset: {new_asset.title} (ID: {new_asset.id})")
                
                # Check if it's in database
                total_assets = CreativeAsset.objects.count()
                print(f"📊 Total assets after creation: {total_assets}")
                
            else:
                print("❌ No categories found - creating a test category")
                test_category = AssetCategory.objects.create(
                    name="Test Category",
                    description="Test category for debugging"
                )
                print(f"✅ Created test category: {test_category.name}")
                
        except Exception as e:
            print(f"❌ Error creating test asset: {e}")
            
        # Now test the API endpoint
        print(f"\n🔌 Testing API endpoint with authentication...")
        test_api_upload(test_user, categories.first() if categories.exists() else None)
    
    else:
        print("❌ No users found in database")
    
    print("\n" + "=" * 50)
    print("🔚 Test completed")

if __name__ == "__main__":
    test_asset_upload()
