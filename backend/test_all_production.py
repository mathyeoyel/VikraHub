#!/usr/bin/env python3
"""
Test production APIs to find where assets are being stored
"""
import requests
import json
from datetime import datetime

def test_production_endpoints():
    """Test multiple production endpoints"""
    print("🌐 Testing VikraHub Production Endpoints")
    print("=" * 60)
    
    # Test multiple URLs
    endpoints = [
        ("Custom Domain API", "https://api.vikrahub.com/api/"),
        ("Render Backend", "https://vikrahub-backend.onrender.com/api/"),
        ("Custom Domain Frontend", "https://vikrahub.com"),
        ("Render Frontend", "https://vikrahub-frontend.onrender.com")  # If it exists
    ]
    
    for name, url in endpoints:
        print(f"\n🔗 Testing {name}")
        print(f"   URL: {url}")
        
        try:
            response = requests.get(url, timeout=20)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                print(f"   ✅ {name} is accessible")
                
                # If this is an API endpoint, test assets
                if "/api/" in url:
                    try:
                        assets_url = f"{url}creative-assets/"
                        assets_response = requests.get(assets_url, timeout=15)
                        print(f"   Assets endpoint status: {assets_response.status_code}")
                        
                        if assets_response.status_code == 200:
                            data = assets_response.json()
                            
                            # Handle both paginated and list responses
                            if isinstance(data, dict):
                                results = data.get('results', [])
                                total = data.get('count', len(results))
                            elif isinstance(data, list):
                                results = data
                                total = len(results)
                            else:
                                results = []
                                total = 0
                            
                            print(f"   📊 Total assets: {total}")
                            print(f"   📋 Assets in this page: {len(results)}")
                            
                            if results:
                                print(f"   🎨 Recent assets:")
                                for i, asset in enumerate(results[:5], 1):  # Show 5 instead of 3
                                    created = asset.get('created_at', 'Unknown')
                                    if created != 'Unknown':
                                        # Parse date to show relative time
                                        try:
                                            from datetime import datetime
                                            date_obj = datetime.fromisoformat(created.replace('Z', '+00:00'))
                                            days_ago = (datetime.now().replace(tzinfo=date_obj.tzinfo) - date_obj).days
                                            time_str = f"{days_ago} days ago" if days_ago > 0 else "Today"
                                        except:
                                            time_str = created[:10]  # Just show date part
                                    else:
                                        time_str = "Unknown"
                                    
                                    seller_info = asset.get('seller', {})
                                    seller_name = seller_info.get('username', 'Unknown') if isinstance(seller_info, dict) else str(seller_info)
                                    
                                    print(f"     {i}. {asset.get('title', 'Untitled')} by {seller_name} ({time_str})")
                            else:
                                print(f"   ❌ No assets found in API response")
                        else:
                            print(f"   ❌ Assets endpoint error: {assets_response.text[:200]}")
                    except Exception as e:
                        print(f"   ❌ Assets test failed: {e}")
                        
            elif response.status_code == 404:
                print(f"   ❌ {name} not found (404)")
            else:
                print(f"   ❌ {name} returned status {response.status_code}")
                print(f"   Response: {response.text[:100]}...")
                
        except requests.exceptions.ConnectionError:
            print(f"   ❌ Cannot connect to {name}")
        except requests.exceptions.Timeout:
            print(f"   ❌ {name} timed out")
        except Exception as e:
            print(f"   ❌ {name} error: {e}")
    
    print("\n" + "=" * 60)
    print("🔚 Production endpoints test completed")
    print("\n💡 Summary:")
    print("   If any API shows 0 assets, that means uploads aren't reaching the database")
    print("   If APIs show different asset counts, there might be multiple databases")

if __name__ == "__main__":
    test_production_endpoints()
