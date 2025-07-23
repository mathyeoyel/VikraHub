from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import UserProfile, CreatorProfile

class Command(BaseCommand):
    help = 'Convert existing users to creator profiles for homepage testing'

    def handle(self, *args, **options):
        self.stdout.write("Converting existing users to creator profiles...")
        
        # Get existing users and convert some to creators
        users_to_convert = [
            ('awut_paul', 'designer', 'Contemporary UI/UX design with cultural elements', 'advanced'),
            ('maduot_chongo', 'artist', 'Traditional South Sudanese art with modern techniques', 'intermediate'),
            ('akon_peter', 'photographer', 'Documentary and portrait photography', 'expert'),
        ]
        
        created_count = 0
        
        for username, creator_type, artistic_style, experience_level in users_to_convert:
            try:
                user = User.objects.get(username=username)
                
                # Check if creator profile already exists
                if CreatorProfile.objects.filter(user=user).exists():
                    self.stdout.write(f"⚠️  Creator profile for {username} already exists")
                    continue
                
                # Update user profile to creator type
                user_profile, created = UserProfile.objects.get_or_create(user=user)
                user_profile.user_type = 'creator'
                user_profile.save()
                
                # Create creator profile
                creator_profile = CreatorProfile.objects.create(
                    user=user,
                    creator_type=creator_type,
                    artistic_style=artistic_style,
                    experience_level=experience_level,
                    years_active=3,
                    art_statement=f"Creating meaningful {creator_type} work that represents South Sudanese culture and creativity.",
                    available_for_commissions=True,
                    commission_types=f"{creator_type.title()} commissions, Custom work, Portfolio pieces",
                    price_range="$50 - $500",
                    is_featured=True,
                    is_verified=True
                )
                
                created_count += 1
                self.stdout.write(f"✅ Created Creator profile for {user.first_name} {user.last_name} - {creator_type}")
                
            except User.DoesNotExist:
                self.stdout.write(f"❌ User {username} not found")
            except Exception as e:
                self.stdout.write(f"❌ Error creating creator profile for {username}: {e}")
        
        self.stdout.write(
            self.style.SUCCESS(f"\n🎉 Successfully created {created_count} creator profiles!")
        )
        self.stdout.write("🌟 All creators are marked as featured for homepage display")
