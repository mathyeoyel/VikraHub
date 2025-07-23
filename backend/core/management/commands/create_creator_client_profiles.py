from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import UserProfile, CreatorProfile, ClientProfile

class Command(BaseCommand):
    help = 'Create sample creator and client profiles for testing'

    def handle(self, *args, **options):
        self.stdout.write("Creating sample Creator and Client profiles...")
        
        # Sample Creator profiles
        creators = [
            {
                'username': 'maria_artisan',
                'first_name': 'Maria',
                'last_name': 'Deng',
                'email': 'maria.deng@vikrahub.com',
                'creator_type': 'artist',
                'artistic_style': 'Contemporary African art with traditional motifs',
                'experience_level': 'intermediate',
                'years_active': 4,
                'portfolio_url': 'https://mariadeng.art',
                'art_statement': 'My art explores the intersection of traditional South Sudanese culture and modern urban life, using vibrant colors and mixed media to tell stories of resilience and hope.',
                'available_for_commissions': True,
                'commission_types': 'Portraits, Murals, Digital Art, Custom Paintings',
                'price_range': '$100 - $1,500',
                'exhibitions': 'Juba Art Festival 2024, Cultural Heritage Exhibition 2023',
                'is_featured': True,
                'headline': 'Contemporary Artist | Cultural Storyteller',
                'bio': 'Creating art that bridges traditional South Sudanese culture with contemporary expression.',
                'user_type': 'creator'
            },
            {
                'username': 'peter_lens',
                'first_name': 'Peter',
                'last_name': 'Kur',
                'email': 'peter.kur@vikrahub.com',
                'creator_type': 'photographer',
                'artistic_style': 'Documentary and portrait photography',
                'experience_level': 'expert',
                'years_active': 8,
                'portfolio_url': 'https://peterkur.photography',
                'art_statement': 'Through my lens, I capture the authentic stories of South Sudan - the struggles, the joy, the everyday moments that define our resilience.',
                'available_for_commissions': True,
                'commission_types': 'Event Photography, Portraits, Documentary Projects, Commercial Photography',
                'price_range': '$200 - $2,000',
                'exhibitions': 'National Geographic Feature 2023, World Press Photo Contest 2024',
                'awards': 'Best Documentary Photography - East Africa Photo Awards 2023',
                'is_featured': True,
                'headline': 'Documentary Photographer | Visual Storyteller',
                'bio': 'Documenting the authentic stories and vibrant culture of South Sudan through photography.',
                'user_type': 'creator'
            },
            {
                'username': 'grace_writer',
                'first_name': 'Grace',
                'last_name': 'Akol',
                'email': 'grace.akol@vikrahub.com',
                'creator_type': 'writer',
                'artistic_style': 'Contemporary fiction and cultural narratives',
                'experience_level': 'advanced',
                'years_active': 6,
                'portfolio_url': 'https://graceakol.stories',
                'art_statement': 'I write to preserve our stories, to give voice to the experiences of South Sudanese people, and to share our rich cultural heritage with the world.',
                'available_for_commissions': True,
                'commission_types': 'Content Writing, Storytelling, Scripts, Cultural Documentation',
                'price_range': '$50 - $800',
                'exhibitions': 'Published in African Literature Today, Featured in BBC Stories',
                'awards': 'Emerging Writer Award - African Literature Prize 2022',
                'headline': 'Writer & Cultural Storyteller',
                'bio': 'Crafting stories that celebrate South Sudanese culture and experiences.',
                'user_type': 'creator'
            }
        ]
        
        # Sample Client profiles
        clients = [
            {
                'username': 'nile_company',
                'first_name': 'James',
                'last_name': 'Mabior',
                'email': 'contact@niletech.ss',
                'client_type': 'business',
                'company_name': 'Nile Tech Solutions',
                'company_size': 'medium',
                'industry': 'Technology',
                'contact_person': 'James Mabior',
                'phone_number': '+211-123-456-789',
                'business_address': 'Juba Business Center, Juba, South Sudan',
                'typical_budget_range': '$500 - $5,000',
                'project_types': 'Logo Design, Website Graphics, Marketing Materials, Photography',
                'preferred_communication': 'Email, Phone, Video Calls',
                'headline': 'Tech Company | Creative Services Client',
                'bio': 'Technology company seeking local creative talent for branding and marketing projects.',
                'user_type': 'client'
            },
            {
                'username': 'heritage_ngo',
                'first_name': 'Sarah',
                'last_name': 'Nyong',
                'email': 'projects@heritagepreservation.org',
                'client_type': 'nonprofit',
                'company_name': 'South Sudan Heritage Preservation',
                'company_size': 'small',
                'industry': 'Non-Profit/Cultural Preservation',
                'contact_person': 'Sarah Nyong',
                'phone_number': '+211-987-654-321',
                'business_address': 'Cultural Quarter, Juba, South Sudan',
                'typical_budget_range': '$200 - $2,000',
                'project_types': 'Documentary Photography, Cultural Art, Educational Materials, Storytelling',
                'preferred_communication': 'Email, In-person meetings',
                'headline': 'Cultural Preservation NGO',
                'bio': 'Non-profit organization dedicated to preserving and promoting South Sudanese cultural heritage.',
                'user_type': 'client'
            },
            {
                'username': 'individual_client',
                'first_name': 'David',
                'last_name': 'Garang',
                'email': 'david.garang@email.com',
                'client_type': 'individual',
                'company_name': '',
                'company_size': 'solo',
                'industry': 'Personal/Individual',
                'contact_person': 'David Garang',
                'phone_number': '+211-555-123-456',
                'business_address': 'Konyokonyo Market Area, Juba',
                'typical_budget_range': '$50 - $500',
                'project_types': 'Family Portraits, Personal Art, Event Photography, Custom Designs',
                'preferred_communication': 'WhatsApp, Phone calls',
                'headline': 'Individual Client | Art Enthusiast',
                'bio': 'Art enthusiast looking to support local creators through personal commissions.',
                'user_type': 'client'
            }
        ]
        
        created_count = 0
        
        # Create Creator profiles
        for creator_data in creators:
            try:
                # Check if user already exists
                if User.objects.filter(username=creator_data['username']).exists():
                    self.stdout.write(f"⚠️  User {creator_data['username']} already exists, skipping...")
                    continue
                
                # Create User
                user = User.objects.create_user(
                    username=creator_data['username'],
                    email=creator_data['email'],
                    first_name=creator_data['first_name'],
                    last_name=creator_data['last_name'],
                    password='VikraHub2025!'
                )
                
                # Create UserProfile
                user_profile = UserProfile.objects.create(
                    user=user,
                    user_type=creator_data['user_type'],
                    headline=creator_data['headline'],
                    bio=creator_data['bio']
                )
                
                # Create CreatorProfile
                creator_profile = CreatorProfile.objects.create(
                    user=user,
                    creator_type=creator_data['creator_type'],
                    artistic_style=creator_data['artistic_style'],
                    experience_level=creator_data['experience_level'],
                    years_active=creator_data['years_active'],
                    portfolio_url=creator_data['portfolio_url'],
                    art_statement=creator_data['art_statement'],
                    available_for_commissions=creator_data['available_for_commissions'],
                    commission_types=creator_data['commission_types'],
                    price_range=creator_data['price_range'],
                    exhibitions=creator_data.get('exhibitions', ''),
                    awards=creator_data.get('awards', ''),
                    is_featured=creator_data.get('is_featured', False)
                )
                
                created_count += 1
                self.stdout.write(f"✅ Created Creator: {creator_data['first_name']} {creator_data['last_name']} - {creator_data['creator_type']}")
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"❌ Error creating creator {creator_data['username']}: {e}")
                )
        
        # Create Client profiles
        for client_data in clients:
            try:
                # Check if user already exists
                if User.objects.filter(username=client_data['username']).exists():
                    self.stdout.write(f"⚠️  User {client_data['username']} already exists, skipping...")
                    continue
                
                # Create User
                user = User.objects.create_user(
                    username=client_data['username'],
                    email=client_data['email'],
                    first_name=client_data['first_name'],
                    last_name=client_data['last_name'],
                    password='VikraHub2025!'
                )
                
                # Create UserProfile
                user_profile = UserProfile.objects.create(
                    user=user,
                    user_type=client_data['user_type'],
                    headline=client_data['headline'],
                    bio=client_data['bio']
                )
                
                # Create ClientProfile
                client_profile = ClientProfile.objects.create(
                    user=user,
                    client_type=client_data['client_type'],
                    company_name=client_data['company_name'],
                    company_size=client_data['company_size'],
                    industry=client_data['industry'],
                    contact_person=client_data['contact_person'],
                    phone_number=client_data['phone_number'],
                    business_address=client_data['business_address'],
                    typical_budget_range=client_data['typical_budget_range'],
                    project_types=client_data['project_types'],
                    preferred_communication=client_data['preferred_communication']
                )
                
                created_count += 1
                self.stdout.write(f"✅ Created Client: {client_data['company_name'] or client_data['first_name']} - {client_data['client_type']}")
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"❌ Error creating client {client_data['username']}: {e}")
                )
        
        self.stdout.write(
            self.style.SUCCESS(f"\n🎉 Successfully created {created_count} new profiles!")
        )
        self.stdout.write("📧 All accounts use password: VikraHub2025!")
        self.stdout.write("🔗 VikraHub email addresses for professional branding")
