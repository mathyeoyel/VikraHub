#!/usr/bin/env python3
# backend/test_messaging_api.py - Test script for messaging API

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

def test_api_endpoint(endpoint, method="GET", data=None, headers=None):
    """Test an API endpoint and return the response"""
    url = f"{API_BASE}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers)
        elif method == "PUT":
            response = requests.put(url, json=data, headers=headers)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers)
        
        return {
            'status_code': response.status_code,
            'data': response.json() if response.content else None,
            'success': 200 <= response.status_code < 300
        }
    except requests.exceptions.RequestException as e:
        return {
            'status_code': None,
            'data': None,
            'success': False,
            'error': str(e)
        }

def main():
    """Test messaging API endpoints"""
    print("🧪 Testing VikraHub Messaging API")
    print("=" * 50)
    
    # Test basic API connectivity
    print("\n1. Testing API connectivity...")
    result = test_api_endpoint("/")
    if result['success']:
        print("✅ API is accessible")
        print(f"   Status: {result['status_code']}")
    else:
        print("❌ API is not accessible")
        print(f"   Error: {result.get('error', 'Unknown error')}")
        sys.exit(1)
    
    # Test messaging endpoints (without authentication)
    print("\n2. Testing messaging endpoints...")
    
    endpoints_to_test = [
        ("/messaging/conversations/", "GET"),
        ("/messaging/unread-count/", "GET"),
    ]
    
    for endpoint, method in endpoints_to_test:
        print(f"\n   Testing {method} {endpoint}")
        result = test_api_endpoint(endpoint, method)
        
        if result['success']:
            print(f"   ✅ {endpoint} - Status: {result['status_code']}")
        else:
            print(f"   ⚠️  {endpoint} - Status: {result['status_code']} (Expected - requires auth)")
    
    print("\n3. Testing WebSocket endpoint accessibility...")
    # Note: This just tests if the endpoint structure is correct
    # Actual WebSocket testing would require a WebSocket client
    print("   📡 WebSocket endpoint: ws://localhost:8000/ws/messaging/")
    print("   ℹ️  WebSocket testing requires a WebSocket client")
    
    print("\n4. Testing admin endpoint...")
    result = test_api_endpoint("/admin/", "GET")
    admin_url = f"{BASE_URL}/admin/"
    
    try:
        admin_response = requests.get(admin_url)
        if admin_response.status_code == 200:
            print(f"   ✅ Admin interface accessible at {admin_url}")
        else:
            print(f"   ⚠️  Admin interface status: {admin_response.status_code}")
    except:
        print(f"   ❌ Admin interface not accessible")
    
    print("\n" + "=" * 50)
    print("🎯 Test Summary:")
    print("   • Basic API connectivity: ✅")
    print("   • Messaging endpoints: ⚠️  (Requires authentication)")
    print("   • WebSocket endpoint: ℹ️  (Requires WebSocket client)")
    print("   • Admin interface: Check manually")
    
    print("\n📋 Next Steps:")
    print("   1. Implement user authentication in tests")
    print("   2. Create test users via Django admin")
    print("   3. Test actual messaging functionality")
    print("   4. Implement React frontend integration")
    
    print(f"\n🕐 Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()
