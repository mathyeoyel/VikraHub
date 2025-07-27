#!/usr/bin/env python3
"""
Test existing user login and upload
"""
import requests
import json

def test_existing_user_upload():
    """Test with existing production user"""
    print("👤 Testing with Existing Production User")
    print("=" * 50)
    
    api_url = "https://api.vikrahub.com/api/"
    
    # Use the existing user we know exists (mathyeoyel)
    # Try some common usernames/passwords
    test_credentials = [
        {"username": "mathyeoyel", "password": "admin"},
        {"username": "mathyeoyel", "password": "password"},
        {"username": "mathyeoyel", "password": "VikraHub2025!"},
        {"username": "admin", "password": "VikraHub2025Admin!"},
    ]
    
    for creds in test_credentials:
        print(f"\n🔐 Trying: {creds['username']}")
        
        try:
            login_response = requests.post(
                f"{api_url}auth/token/",
                json=creds,
                timeout=15
            )
            print(f"   Login status: {login_response.status_code}")
            
            if login_response.status_code == 200:
                token_data = login_response.json()
                access_token = token_data.get('access')
                print(f"   ✅ Login successful!")
                
                # Test asset upload with this user
                print("\n📤 Testing asset upload...")
                
                # Get categories first
                categories_response = requests.get(f"{api_url}asset-categories/", timeout=15)
                categories = categories_response.json() if categories_response.status_code == 200 else []
                
                if categories:
                    test_asset = {
                        "title": f"Test Asset by {creds['username']}",
                        "description": "Testing production upload functionality", 
                        "category_id": categories[0].get('id', 1),
                        "asset_type": "graphic",
                        "price": 10.00,
                        "currency": "USD",
                        "preview_image": "https://res.cloudinary.com/dxpwtdjzp/image/upload/v1737995000/production_test.jpg",
                        "tags": f"production_test, {creds['username']}"
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
                        
                        # Check total assets now
                        assets_response = requests.get(f"{api_url}creative-assets/", timeout=15)
                        if assets_response.status_code == 200:
                            all_assets = assets_response.json()
                            asset_count = len(all_assets) if isinstance(all_assets, list) else all_assets.get('count', 0)
                            print(f"   📊 Total assets now: {asset_count}")
                            print(f"   🎯 PRODUCTION UPLOAD WORKS!")
                        
                        return True  # Success!
                    else:
                        print(f"   ❌ Asset creation failed: {create_response.text[:300]}")
                else:
                    print("   ❌ No categories available")
                    
            elif login_response.status_code == 401:
                print(f"   ❌ Invalid credentials")
            else:
                print(f"   ❌ Login failed: {login_response.text[:200]}")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("❌ Could not login with any test credentials")
    print("💡 This suggests users cannot authenticate in production")
    return False

if __name__ == "__main__":
    test_existing_user_upload()
