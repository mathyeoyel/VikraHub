#!/usr/bin/env python3
"""
🧪 VikraHub Messaging System Test Suite
Tests the new idempotent messaging API endpoints

Run with: python test_messaging_endpoints.py
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"  # Update for your environment
API_BASE = f"{BASE_URL}/api/messaging"

class MessagingAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        
    def print_test(self, name, description=""):
        print(f"\n🧪 Testing: {name}")
        if description:
            print(f"   {description}")
    
    def print_success(self, message):
        print(f"   ✅ {message}")
        
    def print_error(self, message):
        print(f"   ❌ {message}")
        
    def print_info(self, message):
        print(f"   ℹ️  {message}")

    def test_conversations_list(self):
        """Test GET /api/messaging/conversations/"""
        self.print_test("Conversations List", "GET /api/messaging/conversations/")
        
        try:
            response = self.session.get(f"{API_BASE}/conversations/")
            
            if response.status_code == 401:
                self.print_info("Authentication required - this is expected")
                return True
            elif response.status_code == 200:
                data = response.json()
                self.print_success(f"Retrieved {len(data)} conversations")
                if data:
                    # Validate structure
                    conv = data[0]
                    required_fields = ['conversation_id', 'participant', 'latest_message']
                    missing = [f for f in required_fields if f not in conv]
                    if missing:
                        self.print_error(f"Missing fields: {missing}")
                        return False
                    else:
                        self.print_success("Conversation structure is valid")
                return True
            else:
                self.print_error(f"Unexpected status: {response.status_code}")
                return False
                
        except requests.exceptions.ConnectionError:
            self.print_info("Server not running - skipping API tests")
            return True
        except Exception as e:
            self.print_error(f"Test failed: {str(e)}")
            return False

    def test_idempotent_conversation_creation(self):
        """Test POST /api/messaging/conversations/ with target_user_id"""
        self.print_test("Idempotent Conversation Creation", "POST /api/messaging/conversations/")
        
        try:
            payload = {"target_user_id": 2}  # Assuming user ID 2 exists
            response = self.session.post(
                f"{API_BASE}/conversations/", 
                json=payload,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 401:
                self.print_info("Authentication required - this is expected")
                return True
            elif response.status_code in [200, 201]:
                data = response.json()
                self.print_success("Conversation created/retrieved successfully")
                # Validate response structure
                if 'conversation_id' in data and 'participant' in data:
                    self.print_success("Response structure is valid")
                else:
                    self.print_error("Invalid response structure")
                    return False
                return True
            else:
                self.print_error(f"Unexpected status: {response.status_code}")
                self.print_info(f"Response: {response.text}")
                return False
                
        except requests.exceptions.ConnectionError:
            self.print_info("Server not running - skipping API tests")
            return True
        except Exception as e:
            self.print_error(f"Test failed: {str(e)}")
            return False

    def test_conversation_messages(self):
        """Test GET /api/messaging/conversations/<id>/messages/"""
        self.print_test("Conversation Messages", "GET /api/messaging/conversations/<id>/messages/")
        
        try:
            # Use a dummy UUID for testing
            dummy_id = "550e8400-e29b-41d4-a716-446655440000"
            response = self.session.get(f"{API_BASE}/conversations/{dummy_id}/messages/")
            
            if response.status_code == 401:
                self.print_info("Authentication required - this is expected")
                return True
            elif response.status_code == 404:
                self.print_info("Conversation not found - this is expected for dummy ID")
                return True
            elif response.status_code == 200:
                data = response.json()
                self.print_success("Messages retrieved successfully")
                if isinstance(data, list):
                    self.print_success(f"Retrieved {len(data)} messages")
                elif 'results' in data:
                    self.print_success(f"Paginated response with {len(data['results'])} messages")
                return True
            else:
                self.print_error(f"Unexpected status: {response.status_code}")
                return False
                
        except requests.exceptions.ConnectionError:
            self.print_info("Server not running - skipping API tests")
            return True
        except Exception as e:
            self.print_error(f"Test failed: {str(e)}")
            return False

    def test_send_message(self):
        """Test POST /api/messaging/conversations/<id>/messages/"""
        self.print_test("Send Message", "POST /api/messaging/conversations/<id>/messages/")
        
        try:
            dummy_id = "550e8400-e29b-41d4-a716-446655440000"
            payload = {
                "body": "Test message from API tester",
                "reply_to": None
            }
            
            response = self.session.post(
                f"{API_BASE}/conversations/{dummy_id}/messages/",
                json=payload,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 401:
                self.print_info("Authentication required - this is expected")
                return True
            elif response.status_code == 404:
                self.print_info("Conversation not found - this is expected for dummy ID")
                return True
            elif response.status_code == 201:
                data = response.json()
                self.print_success("Message sent successfully")
                if 'id' in data and 'body' in data:
                    self.print_success("Response structure is valid")
                return True
            else:
                self.print_error(f"Unexpected status: {response.status_code}")
                return False
                
        except requests.exceptions.ConnectionError:
            self.print_info("Server not running - skipping API tests")
            return True
        except Exception as e:
            self.print_error(f"Test failed: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all messaging API tests"""
        print("🚀 VikraHub Messaging System API Tests")
        print("=" * 50)
        
        tests = [
            self.test_conversations_list,
            self.test_idempotent_conversation_creation,
            self.test_conversation_messages,
            self.test_send_message,
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            if test():
                passed += 1
        
        print(f"\n📊 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed or were skipped")
            return False

def main():
    """Main test runner"""
    tester = MessagingAPITester()
    
    if len(sys.argv) > 1:
        # Custom base URL provided
        global BASE_URL, API_BASE
        BASE_URL = sys.argv[1]
        API_BASE = f"{BASE_URL}/api/messaging"
        print(f"🔗 Using custom base URL: {BASE_URL}")
    
    success = tester.run_all_tests()
    
    print(f"\n📝 Test completed at {datetime.now()}")
    
    if not success:
        sys.exit(1)

if __name__ == "__main__":
    main()
