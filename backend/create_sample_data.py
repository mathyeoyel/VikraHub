#!/usr/bin/env python
"""
Script to create sample freelancer profiles for testing
"""

import os
import sys
import django

# Set up Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SECRET_KEY', 'dev-secret-key-for-testing')
os.environ.setdefault('DEBUG', 'True')

import django
from django.conf import settings
from django.core.management import execute_from_command_line

# Setup Django
if not settings.configured:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
    django.setup()

from django.contrib.auth.models import User
from core.models import FreelancerProfile, UserProfile

def create_sample_data():
    print("Creating sample freelancer profiles...")
    
    # Sample data
    freelancers = [
        {
            'username': 'akon_peter',
            'first_name': 'Akon',
            'last_name': 'Peter',
            'email': 'akon.peter@example.com',
            'title': 'Professional Photographer',
            'hourly_rate': 75.00,
            'availability': 'Full-time',
            'skill_level': 'expert',
            'years_experience': 5,
            'portfolio_url': 'https://akonpeter.portfolio.com',
            'rating': 4.8,
            'total_jobs': 45,
            'completed_jobs': 42,
            'is_available': True,
            'is_verified': True,
            'bio': 'Through my lens, I tell stories of resilience and the vibrant spirit of my community.',
            'skills': 'Portrait Photography, Street Photography, Event Photography, Photo Editing',
            'location': 'Juba, South Sudan'
        },
        {
            'username': 'maduot_chongo',
            'first_name': 'Maduot',
            'last_name': 'Chongo',
            'email': 'maduot.chongo@example.com',
            'title': 'Creative Designer',
            'hourly_rate': 60.00,
            'availability': 'Part-time',
            'skill_level': 'expert',
            'years_experience': 4,
            'portfolio_url': 'https://maduotdesign.com',
            'rating': 4.7,
            'total_jobs': 38,
            'completed_jobs': 36,
            'is_available': True,
            'is_verified': True,
            'bio': 'Art is my universal language—I use creativity to share our stories with the world.',
            'skills': 'Graphic Design, Brand Identity, Digital Art, Logo Design',
            'location': 'Gudele, South Sudan'
        },
        {
            'username': 'awut_paul',
            'first_name': 'Awut',
            'last_name': 'Paul',
            'email': 'awut.paul@example.com',
            'title': 'Full-Stack Developer',
            'hourly_rate': 85.00,
            'availability': 'Full-time',
            'skill_level': 'expert',
            'years_experience': 6,
            'portfolio_url': 'https://awutpaul.dev',
            'rating': 4.9,
            'total_jobs': 52,
            'completed_jobs': 50,
            'is_available': True,
            'is_verified': True,
            'bio': 'I blend technology and culture, building digital solutions that reflect and celebrate our heritage.',
            'skills': 'Web Development, Mobile Apps, UI/UX Design, Python, React',
            'location': 'Munuki, South Sudan'
        },
        {
            'username': 'buay_moses',
            'first_name': 'Buay',
            'last_name': 'Moses',
            'email': 'buay.moses@example.com',
            'title': 'Business Consultant',
            'hourly_rate': 90.00,
            'availability': 'Part-time',
            'skill_level': 'expert',
            'years_experience': 8,
            'portfolio_url': 'https://buaymoses.consulting',
            'rating': 4.6,
            'total_jobs': 35,
            'completed_jobs': 33,
            'is_available': True,
            'is_verified': True,
            'bio': 'Building innovative businesses that drive economic growth and create opportunities in South Sudan.',
            'skills': 'Business Development, Startup Strategy, Innovation, Market Analysis',
            'location': 'Juba, South Sudan'
        }
    ]
    
    for freelancer_data in freelancers:
        # Check if user already exists
        if User.objects.filter(username=freelancer_data['username']).exists():
            print(f"User {freelancer_data['username']} already exists, skipping...")
            continue
            
        # Create user
        user = User.objects.create_user(
            username=freelancer_data['username'],
            first_name=freelancer_data['first_name'],
            last_name=freelancer_data['last_name'],
            email=freelancer_data['email'],
            password='testpassword123'
        )
        
        # Create or update user profile
        user_profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'bio': freelancer_data['bio'],
                'skills': freelancer_data['skills'],
                'location': freelancer_data['location'],
                'user_type': 'freelancer'
            }
        )
        
        # Create freelancer profile
        freelancer_profile = FreelancerProfile.objects.create(
            user=user,
            title=freelancer_data['title'],
            hourly_rate=freelancer_data['hourly_rate'],
            availability=freelancer_data['availability'],
            skill_level=freelancer_data['skill_level'],
            years_experience=freelancer_data['years_experience'],
            portfolio_url=freelancer_data['portfolio_url'],
            rating=freelancer_data['rating'],
            total_jobs=freelancer_data['total_jobs'],
            completed_jobs=freelancer_data['completed_jobs'],
            is_available=freelancer_data['is_available'],
            is_verified=freelancer_data['is_verified']
        )
        
        print(f"Created freelancer profile for {user.get_full_name()}")
    
    print(f"Sample data creation complete! Created {len(freelancers)} freelancer profiles.")

if __name__ == '__main__':
    create_sample_data()
