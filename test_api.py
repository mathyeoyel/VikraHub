#!/usr/bin/env python
import requests
import time

def test_api():
    try:
        print("Testing API endpoints...")
        
        # Test 1: Non-existent user (should return 404)
        print("\n1. Testing non-existent user:")
        response = requests.get("http://localhost:8000/api/public-profiles/nonexistentuser/", timeout=10)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 404:
            print("✅ SUCCESS: 404 returned for non-existent user")
        else:
            print(f"❌ FAIL: Expected 404, got {response.status_code}")
            print(f"Response: {response.text[:200]}")
        
        # Test 2: API root
        print("\n2. Testing API root:")
        response = requests.get("http://localhost:8000/api/", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:200]}")
        
    except requests.exceptions.ConnectTimeout:
        print("❌ Connection timeout - server may not be responding")
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - server may not be running")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_api()
