#!/usr/bin/env python3
"""
Test API endpoint for asset uploads
"""
import requests
import json

def test_api_upload():
    """Test the creative assets API endpoint"""
    print("🌐 Testing Creative Assets API")
    print("=" * 50)
    
    base_url = "http://127.0.0.1:8000/api/"
    
    # Test 1: Check if API is accessible
    try:
        response = requests.get(f"{base_url}creative-assets/")
        print(f"📊 GET /creative-assets/ Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, dict) and 'results' in data:
                assets = data['results']
            else:
                assets = data if isinstance(data, list) else []
            
            print(f"   Found {len(assets)} assets")
            for asset in assets:
                print(f"   - {asset.get('title', 'Unknown')} by {asset.get('seller_username', 'Unknown')}")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"❌ Error accessing API: {e}")
    
    # Test 2: Check categories API
    try:
        response = requests.get(f"{base_url}asset-categories/")
        print(f"\n📂 GET /asset-categories/ Status: {response.status_code}")
        
        if response.status_code == 200:
            categories = response.json()
            if isinstance(categories, dict) and 'results' in categories:
                categories = categories['results']
            print(f"   Found {len(categories)} categories")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"❌ Error accessing categories API: {e}")
    
    # Test 3: Try to login and get token
    print(f"\n🔐 Testing Authentication")
    try:
        # Try with a known user
        login_data = {
            "username": "mathewyel",  # Known user from our test
            "password": "testpass123"  # Common test password
        }
        
        response = requests.post(f"{base_url}auth/token/", json=login_data)
        print(f"   Login attempt Status: {response.status_code}")
        
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data.get('access')
            print(f"   ✅ Got access token: {access_token[:20]}...")
            
            # Test 4: Try to create an asset with authentication
            print(f"\n📤 Testing Asset Creation with Auth")
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            asset_data = {
                "title": "API Test Asset",
                "description": "Testing asset creation via API",
                "category_id": 1,  # Graphics & Design category
                "asset_type": "graphic",
                "price": 15.99,
                "currency": "USD",
                "preview_image": "https://res.cloudinary.com/test/image/upload/api_test.jpg",
                "tags": "api, test, debug"
            }
            
            response = requests.post(f"{base_url}creative-assets/", json=asset_data, headers=headers)
            print(f"   Create asset Status: {response.status_code}")
            
            if response.status_code in [200, 201]:
                print(f"   ✅ Asset created successfully!")
                created_asset = response.json()
                print(f"   Created: {created_asset.get('title', 'Unknown')} (ID: {created_asset.get('id', 'Unknown')})")
            else:
                print(f"   ❌ Error creating asset: {response.text}")
                
        else:
            print(f"   ❌ Login failed: {response.text}")
            
            # Try with different credentials
            print(f"   Trying different login approaches...")
            
            # Check what authentication methods are available
            response = requests.options(f"{base_url}auth/token/")
            print(f"   OPTIONS /auth/token/ Status: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error with authentication: {e}")
    
    print("\n" + "=" * 50)
    print("🔚 API Test completed")

if __name__ == "__main__":
    test_api_upload()
