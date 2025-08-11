#!/usr/bin/env python3
import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
django.setup()

from core.models import User, UserProfile, PortfolioItem
from django.contrib.auth.hashers import make_password

def create_user_6():
    print("=== Creating User ID 6 ===\n")
    
    # Check if user 6 already exists
    try:
        existing = User.objects.get(id=6)
        print(f"User ID 6 already exists: {existing.username}")
        return
    except User.DoesNotExist:
        pass
    
    # Find the next available ID around 6
    user_id = 6
    while True:
        try:
            User.objects.get(id=user_id)
            user_id += 1
        except User.DoesNotExist:
            break
    
    # Create user
    user = User.objects.create(
        id=6,  # Force ID 6
        username='mathyeoyel',
        email='yelyelyelyai@gmail.com',
        first_name='Mathew',
        last_name='Yel',
        password=make_password('password123'),
        is_active=True
    )
    
    print(f"✅ Created user: {user.username} (ID: {user.id})")
    
    # Create or update profile
    profile, created = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            'user_type': 'creator',
            'bio': 'Creative designer and developer passionate about building amazing digital experiences.',
            'headline': 'Full-Stack Developer & Creative Designer',
            'location': 'Juba, South Sudan',
            'website': 'https://mathyeoyel.dev',
            'skills': 'React, Node.js, Python, Django, UI/UX Design, Creative Direction',
            'avatar': 'https://res.cloudinary.com/dxpwtdjzp/image/upload/v1752924676/avatars/ac9bgmwczywkwn8ipwad.jpg',
            'cover_photo': 'https://res.cloudinary.com/dxpwtdjzp/image/upload/v1753278810/cover_photos/ugrbn72ojriu2sr8xscl.png'
        }
    )
    
    action = "Created" if created else "Updated"
    print(f"✅ {action} profile for {user.username}")
    
    # Add some portfolio items
    portfolio_items = [
        {
            'title': 'Aweil News Agency Website',
            'description': 'Home for reliable news and entertainments.',
            'image': 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=500&h=300&fit=crop',
            'url': 'https://aweilnews.com',
            'tags': 'web development, news, cms, responsive design'
        },
        {
            'title': 'Dineasy; Food Delivery app',
            'description': 'Modern food delivery application with seamless user experience.',
            'image': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500&h=300&fit=crop',
            'url': 'https://github.com/mathyeoyel/dineasy',
            'tags': 'mobile app, food delivery, ui/ux, react native'
        }
    ]
    
    for item_data in portfolio_items:
        item, created = PortfolioItem.objects.get_or_create(
            user=user,
            title=item_data['title'],
            defaults=item_data
        )
        action = "Created" if created else "Updated"
        print(f"✅ {action} portfolio item: {item.title}")
    
    print(f"\n🎉 User setup complete!")
    print(f"Username: {user.username}")
    print(f"Email: {user.email}")
    print(f"Profile URL: /profile/{user.username}")

if __name__ == "__main__":
    create_user_6()
