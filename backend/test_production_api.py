#!/usr/bin/env python3
"""
Test production API to see if asset uploads are working
"""
import requests
import json
from datetime import datetime

def test_production_api():
    """Test the production API endpoints"""
    print("🌐 Testing Production API")
    print("=" * 50)
    
    # Production API URL
    base_url = "https://vikrahub-backend.onrender.com"
    api_url = f"{base_url}/api/"
    
    try:
        # Test basic server connectivity first
        print("1. Testing server connectivity...")
        response = requests.get(base_url, timeout=15)
        print(f"   Server status: {response.status_code}")
        print(f"   Server response length: {len(response.text)}")
        
        # Test API root
        print("\n2. Testing API root...")
        response = requests.get(api_url, timeout=15)
        print(f"   API root status: {response.status_code}")
        
        # Test creative assets endpoint
        print("\n3. Testing creative assets endpoint...")
        response = requests.get(f"{api_url}creative-assets/", timeout=15)
        print(f"   Assets endpoint status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Assets returned: {len(data.get('results', []))}")
            
            # Show recent assets
            results = data.get('results', [])
            if results:
                print("\n📋 Recent assets from production API:")
                for asset in results[:5]:  # Show first 5
                    print(f"   ID: {asset.get('id')}")
                    print(f"   Title: {asset.get('title')}")
                    print(f"   Seller: {asset.get('seller', {}).get('username', 'Unknown')}")
                    print(f"   Created: {asset.get('created_at')}")
                    print("   " + "-" * 30)
            else:
                print("   No assets returned from API")
        else:
            print(f"   Assets error response: {response.text[:300]}")
            
    except requests.exceptions.ConnectionError as e:
        print(f"❌ Could not connect to production server: {e}")
    except requests.exceptions.Timeout:
        print("❌ Request timed out - server might be slow or down")
    except Exception as e:
        print(f"❌ API test error: {e}")
    
    # Test categories endpoint
    try:
        print("\n2. Testing categories endpoint...")
        response = requests.get(f"{api_url}asset-categories/", timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            categories = response.json()
            print(f"   Categories available: {len(categories)}")
        else:
            print(f"   Categories error: {response.text}")
            
    except Exception as e:
        print(f"❌ Categories test error: {e}")
    
    # Test asset creation endpoint (without auth to see error response)
    try:
        print("\n3. Testing asset creation endpoint (no auth)...")
        test_data = {
            "title": "Test Asset",
            "description": "Testing upload",
            "category_id": 1,
            "asset_type": "graphic",
            "preview_image": "https://res.cloudinary.com/dxpwtdjzp/image/upload/v1234567890/test.jpg"
        }
        
        response = requests.post(
            f"{api_url}creative-assets/",
            json=test_data,
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")  # First 200 chars
        
    except Exception as e:
        print(f"❌ Creation test error: {e}")
    
    print("\n" + "=" * 50)
    print("🔚 Production API test completed")

if __name__ == "__main__":
    test_production_api()
