#!/usr/bin/env python3
"""
Portfolio debugging script - checks portfolio items and backend setup
"""
import os
import sys
import subprocess
import time

def run_command(command, cwd=None):
    """Run a command and return the result"""
    try:
        result = subprocess.run(command, shell=True, cwd=cwd, capture_output=True, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def check_django_setup():
    """Check Django models and portfolio items"""
    backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
    
    # Django command to check portfolio items
    django_check = """
from core.models import PortfolioItem
from django.contrib.auth.models import User

# Get portfolio stats
total_items = PortfolioItem.objects.count()
orphaned_items = PortfolioItem.objects.filter(user__isnull=True).count()
users_count = User.objects.count()

print(f'Total portfolio items: {total_items}')
print(f'Orphaned items: {orphaned_items}')
print(f'Total users: {users_count}')

# Show sample portfolio items
if total_items > 0:
    print('\\nSample portfolio items:')
    for item in PortfolioItem.objects.all()[:3]:
        print(f'  ID: {item.id}, Title: {item.title}, User: {item.user.username if item.user else "None"}, Image: {item.image}')

# Fix orphaned items if any exist
if orphaned_items > 0 and users_count > 0:
    first_user = User.objects.first()
    PortfolioItem.objects.filter(user__isnull=True).update(user=first_user)
    print(f'\\nFixed {orphaned_items} orphaned items, assigned to {first_user.username}')
"""
    
    success, stdout, stderr = run_command(f'python manage.py shell -c "{django_check}"', cwd=backend_dir)
    
    if success:
        print("✅ Django check successful:")
        print(stdout)
    else:
        print("❌ Django check failed:")
        print(stderr)
    
    return success

def main():
    print("🔍 VikraHub Portfolio Debug Script")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not os.path.exists('backend') or not os.path.exists('frontend'):
        print("❌ Error: Run this script from the VikraHub project root directory")
        return False
    
    print("\n1. Checking Django backend setup...")
    django_ok = check_django_setup()
    
    if django_ok:
        print("\n✅ All checks passed!")
        print("\n💡 Next steps:")
        print("   1. Make sure Django backend is running: cd backend && python manage.py runserver")
        print("   2. Make sure React frontend is running: cd frontend && npm start")
        print("   3. Open http://localhost:3000 in your browser")
        print("   4. Navigate to a user profile to test portfolio display")
    else:
        print("\n❌ Some checks failed. Please review the errors above.")
    
    return django_ok

if __name__ == "__main__":
    main()
