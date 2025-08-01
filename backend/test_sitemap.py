#!/usr/bin/env python
"""
Test script to verify sitemap functionality
Run this from the backend directory: python test_sitemap.py
"""

import os
import sys
import django
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
django.setup()

# Now test the sitemap
from django.test import Client
from django.urls import reverse

def test_sitemap():
    """Test sitemap functionality"""
    client = Client()
    
    print("🔍 Testing VikraHub Sitemap...")
    
    # Test sitemap.xml
    try:
        response = client.get('/sitemap.xml')
        print(f"📄 Sitemap Status: {response.status_code}")
        
        if response.status_code == 200:
            content = response.content.decode('utf-8')
            print(f"📝 Sitemap Content Preview:")
            print(content[:500] + "..." if len(content) > 500 else content)
            
            # Check if it contains expected URLs
            if '<urlset' in content and '<url>' in content:
                print("✅ Sitemap XML structure looks good!")
            else:
                print("❌ Sitemap XML structure might be invalid")
        else:
            print(f"❌ Sitemap failed with status {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing sitemap: {e}")
    
    # Test robots.txt
    try:
        response = client.get('/robots.txt')
        print(f"🤖 Robots.txt Status: {response.status_code}")
        
        if response.status_code == 200:
            content = response.content.decode('utf-8')
            print(f"📝 Robots.txt Content:")
            print(content)
            print("✅ Robots.txt looks good!")
        else:
            print(f"❌ Robots.txt failed with status {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing robots.txt: {e}")

if __name__ == '__main__':
    test_sitemap()
