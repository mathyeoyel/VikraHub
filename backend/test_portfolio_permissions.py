#!/usr/bin/env python3
import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
django.setup()

from core.models import PortfolioItem, User
from rest_framework_simplejwt.tokens import RefreshToken

def test_portfolio_permissions():
    print("=== Testing Portfolio Permissions ===\n")
    
    # Get the user and portfolio item
    user = User.objects.get(username='mathyeoyel')
    portfolio_item = PortfolioItem.objects.get(id=10)
    
    print(f"User: {user.username} (ID: {user.id})")
    print(f"User Active: {user.is_active}")
    print(f"Portfolio Item: {portfolio_item.title} (ID: {portfolio_item.id})")
    print(f"Portfolio Owner: {portfolio_item.user.username} (ID: {portfolio_item.user.id})")
    print(f"Ownership Match: {user.id == portfolio_item.user.id}")
    
    # Generate fresh tokens
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    
    print(f"\n✅ Fresh tokens generated for {user.username}")
    print(f"Access Token (first 50 chars): {access_token[:50]}...")
    
    # Test API permissions
    print(f"\n🔍 Permission Check:")
    print(f"  - User can edit their own portfolio item: {user.is_active and user.id == portfolio_item.user.id}")
    print(f"  - User account status: {'Active' if user.is_active else 'Inactive'}")
    
    return {
        'user_id': user.id,
        'portfolio_item_id': portfolio_item.id,
        'can_edit': user.is_active and user.id == portfolio_item.user.id,
        'access_token': access_token[:50] + '...'
    }

if __name__ == "__main__":
    result = test_portfolio_permissions()
    print(f"\n🎯 Result: {result}")
