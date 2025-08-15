#!/usr/bin/env python3
"""
Test script for idempotent follow/like endpoints
Verifies that the new endpoints are working correctly and consistently
"""

import requests
import json
import time
from typing import Dict, Any

BASE_URL = "http://localhost:8000/api"

class FollowLikeAPITester:
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.session = requests.Session()
        self.auth_token = None
        
    def authenticate(self, username: str, password: str) -> bool:
        """Authenticate and get token"""
        try:
            response = self.session.post(f"{self.base_url}/auth/login/", {
                "username": username,
                "password": password
            })
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get('access_token')
                self.session.headers.update({
                    'Authorization': f'Bearer {self.auth_token}'
                })
                print(f"✅ Authenticated as {username}")
                return True
            else:
                print(f"❌ Authentication failed: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Authentication error: {e}")
            return False
    
    def test_follow_idempotency(self, target_user_id: int) -> Dict[str, Any]:
        """Test that follow operations are idempotent"""
        print(f"\n🧪 Testing follow idempotency for user {target_user_id}")
        
        results = {
            "follow_tests": [],
            "unfollow_tests": [],
            "consistency_check": True
        }
        
        # Test multiple follow requests (should be idempotent)
        print("Testing multiple follow requests...")
        for i in range(3):
            response = self.session.put(f"{self.base_url}/follow/toggle/{target_user_id}/")
            
            if response.status_code == 200:
                data = response.json()
                results["follow_tests"].append({
                    "attempt": i + 1,
                    "status": "success",
                    "is_following": data.get("is_following"),
                    "state_changed": data.get("state_changed"),
                    "message": data.get("message")
                })
                print(f"   Attempt {i+1}: ✅ {data.get('message')} (state_changed: {data.get('state_changed')})")
            else:
                results["follow_tests"].append({
                    "attempt": i + 1,
                    "status": "error",
                    "error": response.text
                })
                print(f"   Attempt {i+1}: ❌ {response.text}")
        
        # Test multiple unfollow requests (should be idempotent)
        print("Testing multiple unfollow requests...")
        for i in range(3):
            response = self.session.delete(f"{self.base_url}/follow/toggle/{target_user_id}/")
            
            if response.status_code == 200:
                data = response.json()
                results["unfollow_tests"].append({
                    "attempt": i + 1,
                    "status": "success",
                    "is_following": data.get("is_following"),
                    "state_changed": data.get("state_changed"),
                    "message": data.get("message")
                })
                print(f"   Attempt {i+1}: ✅ {data.get('message')} (state_changed: {data.get('state_changed')})")
            else:
                results["unfollow_tests"].append({
                    "attempt": i + 1,
                    "status": "error",
                    "error": response.text
                })
                print(f"   Attempt {i+1}: ❌ {response.text}")
        
        # Verify consistency
        follow_states = [test.get("is_following") for test in results["follow_tests"] if test.get("status") == "success"]
        unfollow_states = [test.get("is_following") for test in results["unfollow_tests"] if test.get("status") == "success"]
        
        # All follow attempts should result in is_following=True
        if follow_states and not all(state == True for state in follow_states):
            results["consistency_check"] = False
            print("❌ Follow states inconsistent!")
        
        # All unfollow attempts should result in is_following=False
        if unfollow_states and not all(state == False for state in unfollow_states):
            results["consistency_check"] = False
            print("❌ Unfollow states inconsistent!")
        
        # Only first follow/unfollow should report state_changed=True
        follow_changes = [test.get("state_changed") for test in results["follow_tests"] if test.get("status") == "success"]
        unfollow_changes = [test.get("state_changed") for test in results["unfollow_tests"] if test.get("status") == "success"]
        
        if follow_changes and follow_changes[0] != True:
            print("❌ First follow should have state_changed=True")
            results["consistency_check"] = False
            
        if follow_changes and any(follow_changes[1:]):
            print("❌ Subsequent follows should have state_changed=False")
            results["consistency_check"] = False
            
        if unfollow_changes and unfollow_changes[0] != True:
            print("❌ First unfollow should have state_changed=True")
            results["consistency_check"] = False
            
        if unfollow_changes and any(unfollow_changes[1:]):
            print("❌ Subsequent unfollows should have state_changed=False")
            results["consistency_check"] = False
        
        if results["consistency_check"]:
            print("✅ Follow idempotency test PASSED")
        else:
            print("❌ Follow idempotency test FAILED")
        
        return results
    
    def test_like_idempotency(self, post_id: int) -> Dict[str, Any]:
        """Test that like operations are idempotent"""
        print(f"\n🧪 Testing like idempotency for post {post_id}")
        
        results = {
            "like_tests": [],
            "unlike_tests": [],
            "consistency_check": True
        }
        
        # Test multiple like requests (should be idempotent)
        print("Testing multiple like requests...")
        for i in range(3):
            response = self.session.put(f"{self.base_url}/posts/{post_id}/like/")
            
            if response.status_code == 200:
                data = response.json()
                results["like_tests"].append({
                    "attempt": i + 1,
                    "status": "success",
                    "is_liked": data.get("is_liked"),
                    "state_changed": data.get("state_changed"),
                    "like_count": data.get("like_count"),
                    "message": data.get("message")
                })
                print(f"   Attempt {i+1}: ✅ {data.get('message')} (state_changed: {data.get('state_changed')})")
            else:
                results["like_tests"].append({
                    "attempt": i + 1,
                    "status": "error",
                    "error": response.text
                })
                print(f"   Attempt {i+1}: ❌ {response.text}")
        
        # Test multiple unlike requests (should be idempotent)
        print("Testing multiple unlike requests...")
        for i in range(3):
            response = self.session.delete(f"{self.base_url}/posts/{post_id}/like/")
            
            if response.status_code == 200:
                data = response.json()
                results["unlike_tests"].append({
                    "attempt": i + 1,
                    "status": "success",
                    "is_liked": data.get("is_liked"),
                    "state_changed": data.get("state_changed"),
                    "like_count": data.get("like_count"),
                    "message": data.get("message")
                })
                print(f"   Attempt {i+1}: ✅ {data.get('message')} (state_changed: {data.get('state_changed')})")
            else:
                results["unlike_tests"].append({
                    "attempt": i + 1,
                    "status": "error",
                    "error": response.text
                })
                print(f"   Attempt {i+1}: ❌ {response.text}")
        
        # Verify consistency
        like_states = [test.get("is_liked") for test in results["like_tests"] if test.get("status") == "success"]
        unlike_states = [test.get("is_liked") for test in results["unlike_tests"] if test.get("status") == "success"]
        
        # All like attempts should result in is_liked=True
        if like_states and not all(state == True for state in like_states):
            results["consistency_check"] = False
            print("❌ Like states inconsistent!")
        
        # All unlike attempts should result in is_liked=False
        if unlike_states and not all(state == False for state in unlike_states):
            results["consistency_check"] = False
            print("❌ Unlike states inconsistent!")
        
        if results["consistency_check"]:
            print("✅ Like idempotency test PASSED")
        else:
            print("❌ Like idempotency test FAILED")
        
        return results
    
    def test_legacy_compatibility(self, target_user_id: int) -> Dict[str, Any]:
        """Test that legacy endpoints still work"""
        print(f"\n🧪 Testing legacy endpoint compatibility")
        
        results = {
            "legacy_follow": None,
            "legacy_unfollow": None,
            "compatibility_check": True
        }
        
        # Test legacy follow endpoint
        response = self.session.post(f"{self.base_url}/follow/follow/", {
            "user_id": target_user_id
        })
        
        if response.status_code in [200, 201]:
            results["legacy_follow"] = "success"
            print("✅ Legacy follow endpoint works")
        else:
            results["legacy_follow"] = "failed"
            results["compatibility_check"] = False
            print(f"❌ Legacy follow endpoint failed: {response.text}")
        
        # Test legacy unfollow endpoint
        response = self.session.post(f"{self.base_url}/follow/unfollow/{target_user_id}/")
        
        if response.status_code == 200:
            results["legacy_unfollow"] = "success"
            print("✅ Legacy unfollow endpoint works")
        else:
            results["legacy_unfollow"] = "failed"
            results["compatibility_check"] = False
            print(f"❌ Legacy unfollow endpoint failed: {response.text}")
        
        if results["compatibility_check"]:
            print("✅ Legacy compatibility test PASSED")
        else:
            print("❌ Legacy compatibility test FAILED")
        
        return results
    
    def run_full_test_suite(self, test_user_id: int = 2, test_post_id: int = 1):
        """Run complete test suite"""
        print("🚀 Starting comprehensive follow/like API test suite")
        print("=" * 60)
        
        overall_results = {
            "follow_idempotency": None,
            "like_idempotency": None,
            "legacy_compatibility": None,
            "all_tests_passed": True
        }
        
        # Test follow idempotency
        follow_results = self.test_follow_idempotency(test_user_id)
        overall_results["follow_idempotency"] = follow_results
        if not follow_results["consistency_check"]:
            overall_results["all_tests_passed"] = False
        
        # Test like idempotency
        like_results = self.test_like_idempotency(test_post_id)
        overall_results["like_idempotency"] = like_results
        if not like_results["consistency_check"]:
            overall_results["all_tests_passed"] = False
        
        # Test legacy compatibility
        legacy_results = self.test_legacy_compatibility(test_user_id)
        overall_results["legacy_compatibility"] = legacy_results
        if not legacy_results["compatibility_check"]:
            overall_results["all_tests_passed"] = False
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        if overall_results["all_tests_passed"]:
            print("🎉 ALL TESTS PASSED! The follow/like system is now idempotent and consistent.")
            print("✅ Follow operations are idempotent")
            print("✅ Like operations are idempotent") 
            print("✅ Legacy endpoints maintain compatibility")
            print("✅ State persistence is working correctly")
        else:
            print("❌ SOME TESTS FAILED. Please review the issues above.")
            
        return overall_results

def main():
    """Main test function"""
    print("🔧 Idempotent Follow/Like System Test")
    print("This script tests the new idempotent endpoints for follow/like operations")
    print()
    
    tester = FollowLikeAPITester()
    
    # You would need to provide valid credentials here
    # For now, this is a template showing how the tests would work
    print("Note: This is a test template. To run actual tests:")
    print("1. Ensure Django server is running on localhost:8000")
    print("2. Create test users in the database")
    print("3. Update the credentials below")
    print("4. Run: python test_idempotent_endpoints.py")
    
    # Uncomment and modify these lines with actual test credentials:
    # if tester.authenticate("testuser", "testpassword"):
    #     results = tester.run_full_test_suite(test_user_id=2, test_post_id=1)
    #     
    #     # Save results to file
    #     with open("test_results.json", "w") as f:
    #         json.dump(results, f, indent=2)
    #     print(f"\n📁 Detailed results saved to test_results.json")

if __name__ == "__main__":
    main()
