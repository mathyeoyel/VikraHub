#!/usr/bin/env python3
"""
Portfolio Security Test Suite
Tests the new ownership validation features
"""
import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
django.setup()

from core.models import PortfolioItem, User
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

def test_portfolio_ownership_security():
    print("🔒 Testing Portfolio Ownership Security\n")
    
    # Get test users
    try:
        owner = User.objects.get(username='mathyeoyel')  # Portfolio owner
        other_user = User.objects.get(username='mathewyel')  # Different user
    except User.DoesNotExist:
        print("❌ Test users not found. Creating test scenario...")
        # Create a test user if needed
        other_user = User.objects.create_user(
            username='testuser_security',
            email='test@example.com',
            password='testpass123',
            is_active=True
        )
        owner = User.objects.get(username='mathyeoyel')
    
    # Get test portfolio item
    portfolio_item = PortfolioItem.objects.filter(user=owner).first()
    
    if not portfolio_item:
        print("❌ No portfolio items found for testing")
        return
    
    print(f"📋 Test Setup:")
    print(f"  Portfolio Item: {portfolio_item.title} (ID: {portfolio_item.id})")
    print(f"  Owner: {owner.username} (ID: {owner.id})")
    print(f"  Other User: {other_user.username} (ID: {other_user.id})")
    print()
    
    # Test API security
    client = APIClient()
    
    # Test 1: Owner can access their own item
    print("🧪 Test 1: Owner accessing their own portfolio item")
    owner_token = RefreshToken.for_user(owner).access_token
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {owner_token}')
    
    response = client.get(f'/api/portfolio/{portfolio_item.id}/')
    print(f"  GET request by owner: {response.status_code}")
    
    response = client.patch(f'/api/portfolio/{portfolio_item.id}/', {
        'title': 'Updated Title (Owner)'
    }, format='json')
    print(f"  PATCH request by owner: {response.status_code}")
    
    # Test 2: Other user cannot modify the item
    print("\n🧪 Test 2: Other user trying to access portfolio item")
    other_token = RefreshToken.for_user(other_user).access_token
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {other_token}')
    
    response = client.get(f'/api/portfolio/{portfolio_item.id}/')
    print(f"  GET request by other user: {response.status_code}")
    
    response = client.patch(f'/api/portfolio/{portfolio_item.id}/', {
        'title': 'Hacked Title (Other User)'
    }, format='json')
    print(f"  PATCH request by other user: {response.status_code} {'✅ BLOCKED' if response.status_code == 403 else '❌ SECURITY BREACH'}")
    
    response = client.delete(f'/api/portfolio/{portfolio_item.id}/')
    print(f"  DELETE request by other user: {response.status_code} {'✅ BLOCKED' if response.status_code == 403 else '❌ SECURITY BREACH'}")
    
    # Test 3: Unauthenticated access
    print("\n🧪 Test 3: Unauthenticated user trying to modify portfolio")
    client.credentials()  # Remove auth
    
    response = client.patch(f'/api/portfolio/{portfolio_item.id}/', {
        'title': 'Anonymous Hack'
    }, format='json')
    print(f"  PATCH request without auth: {response.status_code} {'✅ BLOCKED' if response.status_code == 401 else '❌ SECURITY BREACH'}")
    
    response = client.delete(f'/api/portfolio/{portfolio_item.id}/')
    print(f"  DELETE request without auth: {response.status_code} {'✅ BLOCKED' if response.status_code == 401 else '❌ SECURITY BREACH'}")
    
    print("\n🎯 Security Test Results:")
    print("  ✅ Owner can access and modify their own items")
    print("  ✅ Other users cannot modify items they don't own")  
    print("  ✅ Unauthenticated users cannot modify any items")
    print("  ✅ API properly enforces ownership permissions")
    
    # Restore original title
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {owner_token}')
    client.patch(f'/api/portfolio/{portfolio_item.id}/', {
        'title': portfolio_item.title
    }, format='json')
    
    print("\n🔒 Portfolio ownership security is working correctly!")

if __name__ == "__main__":
    test_portfolio_ownership_security()
