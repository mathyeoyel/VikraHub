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
    print("Creating comprehensive freelancer profiles with full user accounts...")
    
    # Enhanced sample data with complete profile information
    freelancers = [
        {
            'username': 'akon_peter',
            'first_name': 'Akon',
            'last_name': 'Peter',
            'email': 'akon.peter@vikrahub.com',
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
            # UserProfile fields
            'headline': 'Professional Photographer | Visual Storyteller | South Sudan',
            'bio': 'Through my lens, I tell stories of resilience and the vibrant spirit of my community. With over 5 years of experience capturing the essence of South Sudan, I specialize in portrait, street, and event photography that showcases our culture and people.',
            'skills': 'Portrait Photography, Street Photography, Event Photography, Photo Editing, Adobe Lightroom, Adobe Photoshop, Wedding Photography, Corporate Events',
            'avatar': 'https://res.cloudinary.com/dxpwtdjzp/image/upload/v1234567890/profiles/akon_peter.jpg',
            'website': 'https://akonpeter.photography',
            'instagram': 'akon_peter_photography',
            'facebook': 'AkonPeterPhotography',
            'linkedin': 'akon-peter-photographer',
            'twitter': 'akonpeter_photo'
        },
        {
            'username': 'maduot_chongo',
            'first_name': 'Maduot',
            'last_name': 'Chongo',
            'email': 'maduot.chongo@vikrahub.com',
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
            # UserProfile fields
            'headline': 'Creative Designer | Brand Identity Expert | Digital Artist',
            'bio': 'Art is my universal language—I use creativity to share our stories with the world. I specialize in creating compelling brand identities and digital art that reflects the rich culture and heritage of South Sudan while meeting modern design standards.',
            'skills': 'Graphic Design, Brand Identity, Digital Art, Logo Design, Adobe Creative Suite, Figma, UI/UX Design, Print Design, Web Design',
            'avatar': 'https://res.cloudinary.com/dxpwtdjzp/image/upload/v1234567890/profiles/maduot_chongo.jpg',
            'website': 'https://maduotdesign.studio',
            'instagram': 'maduot_designs',
            'facebook': 'MaduotDesignStudio',
            'linkedin': 'maduot-chongo-designer',
            'twitter': 'maduot_design'
        },
        {
            'username': 'awut_paul',
            'first_name': 'Awut',
            'last_name': 'Paul',
            'email': 'awut.paul@vikrahub.com',
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
            # UserProfile fields
            'headline': 'Full-Stack Developer | Tech Innovator | Building Digital Solutions',
            'bio': 'I blend technology and culture, building digital solutions that reflect and celebrate our heritage. With 6 years of experience in web and mobile development, I create scalable applications that serve communities and businesses across South Sudan.',
            'skills': 'Web Development, Mobile Apps, UI/UX Design, Python, React, Django, JavaScript, Node.js, PostgreSQL, AWS, Docker',
            'avatar': 'https://res.cloudinary.com/dxpwtdjzp/image/upload/v1234567890/profiles/awut_paul.jpg',
            'website': 'https://awutpaul.dev',
            'github': 'awutpaul',
            'linkedin': 'awut-paul-developer',
            'twitter': 'awut_codes',
            'instagram': 'awut_tech'
        },
        {
            'username': 'buay_moses',
            'first_name': 'Buay',
            'last_name': 'Moses',
            'email': 'buay.moses@vikrahub.com',
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
            # UserProfile fields
            'headline': 'Business Consultant | Entrepreneur | Strategy & Innovation Expert',
            'bio': 'Building innovative businesses that drive economic growth and create opportunities in South Sudan. With 8 years of experience in business development and strategy, I help startups and established companies achieve sustainable growth.',
            'skills': 'Business Development, Startup Strategy, Innovation, Market Analysis, Financial Planning, Project Management, Leadership, Strategic Planning',
            'avatar': 'https://res.cloudinary.com/dxpwtdjzp/image/upload/v1234567890/profiles/buay_moses.jpg',
            'website': 'https://buaymoses.consulting',
            'linkedin': 'buay-moses-consultant',
            'twitter': 'buay_consulting',
            'facebook': 'BuayMosesConsulting'
        },
        {
            'username': 'grace_pascal',
            'first_name': 'Grace',
            'last_name': 'Pascal',
            'email': 'grace.pascal@vikrahub.com',
            'title': 'Tech Enthusiast & Educator',
            'hourly_rate': 55.00,
            'availability': 'Part-time',
            'skill_level': 'intermediate',
            'years_experience': 3,
            'portfolio_url': 'https://gracepascal.tech',
            'rating': 4.5,
            'total_jobs': 28,
            'completed_jobs': 26,
            'is_available': True,
            'is_verified': True,
            # UserProfile fields
            'headline': 'Tech Educator | Digital Literacy Advocate | Community Builder',
            'bio': 'Passionate about leveraging technology to empower communities and drive positive change. I focus on digital literacy education and helping people in South Sudan access and benefit from modern technology.',
            'skills': 'Tech Education, Digital Literacy, Community Outreach, Microsoft Office, Basic Programming, Social Media Management, Content Creation',
            'avatar': 'https://res.cloudinary.com/dxpwtdjzp/image/upload/v1234567890/profiles/grace_pascal.jpg',
            'website': 'https://gracepascal.tech',
            'linkedin': 'grace-pascal-educator',
            'twitter': 'grace_tech_ed',
            'facebook': 'GracePascalTech'
        },
        {
            'username': 'james_mayen',
            'first_name': 'James',
            'last_name': 'Mayen',
            'email': 'james.mayen@vikrahub.com',
            'title': 'Tech Researcher',
            'hourly_rate': 50.00,
            'availability': 'Part-time',
            'skill_level': 'intermediate',
            'years_experience': 2,
            'portfolio_url': 'https://jamesmayen.research',
            'rating': 4.3,
            'total_jobs': 15,
            'completed_jobs': 14,
            'is_available': True,
            'is_verified': False,
            # UserProfile fields
            'headline': 'Tech Researcher | Innovation Explorer | Emerging Technologies',
            'bio': 'Exploring emerging technologies and their potential to transform our digital landscape. I research and analyze new technological trends and their applications for developing markets.',
            'skills': 'Technology Research, Emerging Tech Analysis, Tech Education, Data Analysis, Research Writing, Innovation Strategy',
            'avatar': 'https://res.cloudinary.com/dxpwtdjzp/image/upload/v1234567890/profiles/james_mayen.jpg',
            'website': 'https://jamesmayen.research',
            'linkedin': 'james-mayen-researcher',
            'twitter': 'james_tech_research'
        }
    ]
    
    for freelancer_data in freelancers:
        # Check if user already exists
        if User.objects.filter(username=freelancer_data['username']).exists():
            print(f"User {freelancer_data['username']} already exists, updating profile...")
            user = User.objects.get(username=freelancer_data['username'])
            
            # Update user information
            user.first_name = freelancer_data['first_name']
            user.last_name = freelancer_data['last_name']
            user.email = freelancer_data['email']
            user.save()
        else:
            # Create new user
            user = User.objects.create_user(
                username=freelancer_data['username'],
                first_name=freelancer_data['first_name'],
                last_name=freelancer_data['last_name'],
                email=freelancer_data['email'],
                password='VikraHub2025!'  # Secure password for demo accounts
            )
            print(f"Created new user: {user.get_full_name()}")
        
        # Create or update comprehensive user profile
        user_profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'user_type': 'freelancer',
                'headline': freelancer_data['headline'],
                'bio': freelancer_data['bio'],
                'skills': freelancer_data['skills'],
                'avatar': freelancer_data['avatar'],
                'website': freelancer_data.get('website', ''),
                'twitter': freelancer_data.get('twitter', ''),
                'instagram': freelancer_data.get('instagram', ''),
                'facebook': freelancer_data.get('facebook', ''),
                'linkedin': freelancer_data.get('linkedin', ''),
                'github': freelancer_data.get('github', ''),
            }
        )
        
        # Update existing profile if it was already created
        if not created:
            user_profile.user_type = 'freelancer'
            user_profile.headline = freelancer_data['headline']
            user_profile.bio = freelancer_data['bio']
            user_profile.skills = freelancer_data['skills']
            user_profile.avatar = freelancer_data['avatar']
            user_profile.website = freelancer_data.get('website', '')
            user_profile.twitter = freelancer_data.get('twitter', '')
            user_profile.instagram = freelancer_data.get('instagram', '')
            user_profile.facebook = freelancer_data.get('facebook', '')
            user_profile.linkedin = freelancer_data.get('linkedin', '')
            user_profile.github = freelancer_data.get('github', '')
            user_profile.save()
            print(f"Updated profile for: {user.get_full_name()}")
        else:
            print(f"Created new profile for: {user.get_full_name()}")
        
        # Create or update freelancer profile
        freelancer_profile, created = FreelancerProfile.objects.get_or_create(
            user=user,
            defaults={
                'title': freelancer_data['title'],
                'hourly_rate': freelancer_data['hourly_rate'],
                'availability': freelancer_data['availability'],
                'skill_level': freelancer_data['skill_level'],
                'years_experience': freelancer_data['years_experience'],
                'portfolio_url': freelancer_data['portfolio_url'],
                'rating': freelancer_data['rating'],
                'total_jobs': freelancer_data['total_jobs'],
                'completed_jobs': freelancer_data['completed_jobs'],
                'is_available': freelancer_data['is_available'],
                'is_verified': freelancer_data['is_verified']
            }
        )
        
        # Update existing freelancer profile if it was already created
        if not created:
            freelancer_profile.title = freelancer_data['title']
            freelancer_profile.hourly_rate = freelancer_data['hourly_rate']
            freelancer_profile.availability = freelancer_data['availability']
            freelancer_profile.skill_level = freelancer_data['skill_level']
            freelancer_profile.years_experience = freelancer_data['years_experience']
            freelancer_profile.portfolio_url = freelancer_data['portfolio_url']
            freelancer_profile.rating = freelancer_data['rating']
            freelancer_profile.total_jobs = freelancer_data['total_jobs']
            freelancer_profile.completed_jobs = freelancer_data['completed_jobs']
            freelancer_profile.is_available = freelancer_data['is_available']
            freelancer_profile.is_verified = freelancer_data['is_verified']
            freelancer_profile.save()
            print(f"Updated freelancer profile for: {user.get_full_name()}")
        else:
            print(f"Created new freelancer profile for: {user.get_full_name()}")
    
    print(f"\n✅ Sample data creation complete!")
    print(f"📊 Created/Updated {len(freelancers)} comprehensive freelancer profiles")
    print(f"🔐 All accounts use password: 'VikraHub2025!'")
    print(f"📧 All profiles have VikraHub email addresses")
    print(f"🌐 Complete with social media links and professional information")
    print(f"🎯 Ready for testing the Creators page with real data!")

if __name__ == '__main__':
    create_sample_data()
