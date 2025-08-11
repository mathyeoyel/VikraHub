#!/usr/bin/env python3

"""
Test script for the new scoped portfolio/works endpoints
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def test_endpoints():
    print("🔍 Testing Scoped Portfolio/Works Endpoints")
    print("=" * 50)
    
    # Test 1: Anonymous GET to /portfolio/ (should return empty or 401)
    print("\n1. Anonymous GET /portfolio/ (should be scoped)")
    try:
        response = requests.get(f"{BASE_URL}/portfolio/")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Items returned: {len(data)}")
            if len(data) > 0:
                print(f"   First item user: {data[0].get('user', 'No user field')}")
            else:
                print("   ✅ Empty result - good for scoped API")
        else:
            print(f"   Response: {response.text[:200]}...")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 2: Anonymous GET to /works/ (should return empty or 401)
    print("\n2. Anonymous GET /works/ (should be scoped)")
    try:
        response = requests.get(f"{BASE_URL}/works/")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Items returned: {len(data)}")
            if len(data) > 0:
                print(f"   First item user: {data[0].get('user', 'No user field')}")
            else:
                print("   ✅ Empty result - good for scoped API")
        else:
            print(f"   Response: {response.text[:200]}...")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 3: Public profile view with username
    print("\n3. GET /portfolio/?username=mathyeoyel")
    try:
        response = requests.get(f"{BASE_URL}/portfolio/?username=mathyeoyel")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Items returned: {len(data)}")
            if len(data) > 0:
                print(f"   First item user: {data[0].get('user', 'No user field')}")
                print(f"   All items belong to mathyeoyel: {all(item.get('user', {}).get('username') == 'mathyeoyel' for item in data)}")
            else:
                print("   No items found for mathyeoyel")
        else:
            print(f"   Response: {response.text[:200]}...")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 4: Check route availability
    print("\n4. Available routes check")
    endpoints_to_check = [
        "/portfolio/",
        "/works/", 
        "/portfolio/mine/",
        "/works/mine/"
    ]
    
    for endpoint in endpoints_to_check:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}")
            print(f"   {endpoint}: {response.status_code}")
        except Exception as e:
            print(f"   {endpoint}: Error - {e}")
    
    print("\n✅ Endpoint testing complete!")
    print("\nNote: /mine/ endpoints require authentication and will return 401 when accessed anonymously")

if __name__ == "__main__":
    test_endpoints()
