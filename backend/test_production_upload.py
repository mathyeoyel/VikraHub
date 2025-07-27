#!/usr/bin/env python3
"""
Test upload functionality to production API
"""
import requests
import json

def test_production_upload():
    """Test asset upload to production"""
    print("🧪 Testing Production Asset Upload")
    print("=" * 50)
    
    api_url = "https://api.vikrahub.com/api/"
    
    # Step 1: Test if we can get authentication token
    print("1. Testing authentication...")
    
    # Try to register a test user first (to get auth token)
    test_user_data = {
        "username": "upload_test_user_2025",
        "email": "test_upload_2025@example.com", 
        "password": "TestPassword123!",
        "password2": "TestPassword123!"
    }
    
    try:
        # Try to register
        register_response = requests.post(
            f"{api_url}auth/register/",
            json=test_user_data,
            timeout=15
        )
        print(f"   Register status: {register_response.status_code}")
        
        if register_response.status_code in [200, 201]:
            print("   ✅ User registered successfully")
        elif register_response.status_code == 400:
            print("   ℹ️ User might already exist, trying login...")
        else:
            print(f"   ❌ Registration failed: {register_response.text[:200]}")
    
        # Try to login
        login_data = {
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        }
        
        login_response = requests.post(
            f"{api_url}auth/token/",
            json=login_data,
            timeout=15
        )
        print(f"   Login status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            token_data = login_response.json()
            access_token = token_data.get('access')
            print(f"   ✅ Got access token")
            
            # Step 2: Test asset categories
            print("\n2. Testing categories...")
            categories_response = requests.get(
                f"{api_url}asset-categories/",
                timeout=15
            )
            print(f"   Categories status: {categories_response.status_code}")
            
            categories = []
            if categories_response.status_code == 200:
                categories = categories_response.json()
                print(f"   ✅ Found {len(categories)} categories")
            
            # Step 3: Test asset creation
            print("\n3. Testing asset creation...")
            
            if categories:
                test_asset = {
                    "title": "Production Upload Test Asset",
                    "description": "Testing asset upload to production database",
                    "category_id": categories[0].get('id', 1),
                    "asset_type": "graphic",
                    "price": 5.00,
                    "currency": "USD",
                    "preview_image": "https://res.cloudinary.com/dxpwtdjzp/image/upload/v1737995000/test_production_upload.jpg",
                    "tags": "test, production, debug"
                }
                
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }
                
                create_response = requests.post(
                    f"{api_url}creative-assets/",
                    json=test_asset,
                    headers=headers,
                    timeout=15
                )
                
                print(f"   Asset creation status: {create_response.status_code}")
                
                if create_response.status_code in [200, 201]:
                    asset_data = create_response.json()
                    print(f"   ✅ Asset created successfully!")
                    print(f"      Asset ID: {asset_data.get('id')}")
                    print(f"      Title: {asset_data.get('title')}")
                    
                    # Verify it appears in the database
                    print("\n4. Verifying asset in database...")
                    assets_response = requests.get(
                        f"{api_url}creative-assets/",
                        timeout=15
                    )
                    
                    if assets_response.status_code == 200:
                        all_assets = assets_response.json()
                        if isinstance(all_assets, list):
                            asset_count = len(all_assets)
                        else:
                            asset_count = all_assets.get('count', 0)
                        
                        print(f"   📊 Total assets now: {asset_count}")
                        print(f"   ✅ Upload test successful!")
                    
                else:
                    print(f"   ❌ Asset creation failed!")
                    print(f"      Response: {create_response.text}")
            else:
                print("   ❌ No categories available for testing")
                
        else:
            print(f"   ❌ Login failed: {login_response.text[:200]}")
            
    except requests.exceptions.ConnectionError:
        print("   ❌ Cannot connect to production API")
    except Exception as e:
        print(f"   ❌ Test error: {e}")
    
    print("\n" + "=" * 50)
    print("🔚 Production upload test completed")

if __name__ == "__main__":
    test_production_upload()
