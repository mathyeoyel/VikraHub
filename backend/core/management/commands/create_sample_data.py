from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import FreelancerProfile, UserProfile

class Command(BaseCommand):
    help = 'Create sample freelancer profiles for testing'

    def handle(self, *args, **options):
        self.stdout.write("Creating comprehensive freelancer profiles with full user accounts...")
        
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
                'portfolio_url': 'https://akonpeter.photography',
                'rating': 4.8,
                'total_jobs': 45,
                'completed_jobs': 42,
                'is_available': True,
                'is_verified': True,
                'headline': 'Professional Photographer | Visual Storyteller | South Sudan',
                'bio': 'Through my lens, I tell stories of resilience and the vibrant spirit of my community. With over 5 years of experience capturing the essence of South Sudan, I specialize in portrait, street, and event photography that showcases our culture and people.',
                'location': 'Juba, South Sudan',
                'skills': 'Portrait Photography, Street Photography, Event Photography, Photo Editing, Adobe Lightroom, Adobe Photoshop, Digital Photography, Studio Photography',
                'website': 'https://akonpeter.photography',
                'social_media': '{"instagram": "akon_peter_photography", "linkedin": "akon-peter-photographer", "facebook": "AkonPeterPhotography"}',
                'user_type': 'freelancer'
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
                'portfolio_url': 'https://maduotdesign.studio',
                'rating': 4.7,
                'total_jobs': 38,
                'completed_jobs': 36,
                'is_available': True,
                'is_verified': True,
                'headline': 'Creative Designer | Brand Identity Specialist | Visual Artist',
                'bio': 'Creating visual identities that bridge traditional South Sudanese culture with modern design principles. I help businesses and organizations tell their stories through compelling graphic design, logos, and brand materials.',
                'location': 'Juba, South Sudan',
                'skills': 'Graphic Design, Brand Identity, Logo Design, Digital Art, Adobe Creative Suite, Typography, Print Design, Web Design, UI/UX Design',
                'website': 'https://maduotdesign.studio',
                'social_media': '{"instagram": "maduot_designs", "linkedin": "maduot-chongo-designer", "behance": "maduotchongo"}',
                'user_type': 'freelancer'
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
                'headline': 'Full-Stack Developer | Python Expert | Mobile App Developer',
                'bio': 'Building digital solutions that empower communities across South Sudan. With expertise in web and mobile development, I create applications that solve real-world problems and bridge the digital divide in our region.',
                'location': 'Juba, South Sudan',
                'skills': 'Python, Django, React, JavaScript, Node.js, Mobile App Development, PostgreSQL, MongoDB, AWS, Docker, Git',
                'website': 'https://awutpaul.dev',
                'social_media': '{"github": "awutpaul", "linkedin": "awut-paul-developer", "twitter": "awut_dev", "instagram": "awut_tech"}',
                'user_type': 'freelancer'
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
                'headline': 'Business Development Consultant | Startup Strategist | Innovation Leader',
                'bio': 'Helping entrepreneurs and organizations across East Africa build sustainable businesses. With extensive experience in startup development and market analysis, I guide ventures from concept to successful implementation.',
                'location': 'Juba, South Sudan',
                'skills': 'Business Development, Startup Strategy, Market Analysis, Financial Planning, Project Management, Innovation, Leadership, Strategic Planning',
                'website': 'https://buaymoses.consulting',
                'social_media': '{"linkedin": "buay-moses-consultant", "twitter": "buay_business", "facebook": "BuayMosesConsulting"}',
                'user_type': 'freelancer'
            },
            {
                'username': 'grace_pascal',
                'first_name': 'Grace',
                'last_name': 'Pascal',
                'email': 'grace.pascal@vikrahub.com',
                'title': 'Tech Educator',
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
                'headline': 'Tech Educator | Digital Literacy Advocate | Community Builder',
                'bio': 'Bridging the digital divide through education and community outreach. I specialize in teaching technology skills to underserved communities, focusing on practical applications that improve livelihoods and opportunities.',
                'location': 'Juba, South Sudan',
                'skills': 'Technology Education, Digital Literacy, Community Outreach, Training Development, Computer Skills, Microsoft Office, Basic Programming, Workshop Facilitation',
                'website': 'https://gracepascal.tech',
                'social_media': '{"linkedin": "grace-pascal-educator", "facebook": "GracePascalTech", "twitter": "grace_teaches"}',
                'user_type': 'freelancer'
            },
            {
                'username': 'james_mayen',
                'first_name': 'James',
                'last_name': 'Mayen',
                'email': 'james.mayen@vikrahub.com',
                'title': 'Tech Researcher',
                'hourly_rate': 50.00,
                'availability': 'Flexible',
                'skill_level': 'intermediate',
                'years_experience': 2,
                'portfolio_url': 'https://jamesmayen.research',
                'rating': 4.3,
                'total_jobs': 15,
                'completed_jobs': 14,
                'is_available': True,
                'is_verified': False,
                'headline': 'Technology Researcher | Data Analyst | Innovation Scout',
                'bio': 'Exploring emerging technologies and their potential applications in developing markets. I research and analyze tech trends, providing insights for organizations looking to adopt innovative solutions.',
                'location': 'Juba, South Sudan',
                'skills': 'Technology Research, Data Analysis, Market Research, Report Writing, Python, Excel, Survey Design, Trend Analysis',
                'website': 'https://jamesmayen.research',
                'social_media': '{"linkedin": "james-mayen-researcher", "twitter": "james_tech_research"}',
                'user_type': 'freelancer'
            }
        ]

        created_count = 0
        for freelancer_data in freelancers:
            # Check if user already exists
            if User.objects.filter(username=freelancer_data['username']).exists():
                self.stdout.write(f"User {freelancer_data['username']} already exists, skipping...")
                continue

            try:
                # Create User
                user = User.objects.create_user(
                    username=freelancer_data['username'],
                    email=freelancer_data['email'],
                    password='VikraHub2025!',
                    first_name=freelancer_data['first_name'],
                    last_name=freelancer_data['last_name']
                )

                # Create UserProfile
                user_profile = UserProfile.objects.create(
                    user=user,
                    user_type=freelancer_data['user_type'],
                    headline=freelancer_data['headline'],
                    bio=freelancer_data['bio'],
                    location=freelancer_data['location'],
                    skills=freelancer_data['skills'],
                    website=freelancer_data['website'],
                    social_media=freelancer_data['social_media']
                )

                # Create FreelancerProfile
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

                created_count += 1
                self.stdout.write(f"✅ Created {freelancer_data['first_name']} {freelancer_data['last_name']} - {freelancer_data['title']}")
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"❌ Error creating {freelancer_data['username']}: {e}")
                )

        self.stdout.write(
            self.style.SUCCESS(f"\n🎉 Successfully created {created_count} freelancer accounts!")
        )
        self.stdout.write("📧 All accounts use password: VikraHub2025!")
        self.stdout.write("🔗 VikraHub email addresses for professional branding")
