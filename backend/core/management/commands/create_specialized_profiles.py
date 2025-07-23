from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import UserProfile, CreatorProfile, FreelancerProfile, ClientProfile

class Command(BaseCommand):
    help = 'Create specialized profiles for existing users based on their user_type'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force recreation of existing specialized profiles',
        )

    def handle(self, *args, **options):
        force = options['force']
        
        self.stdout.write('Starting specialized profile creation...')
        
        users = User.objects.all()
        created_count = {'creator': 0, 'freelancer': 0, 'client': 0}
        updated_count = {'creator': 0, 'freelancer': 0, 'client': 0}
        
        for user in users:
            try:
                # Get or create UserProfile
                user_profile, created = UserProfile.objects.get_or_create(
                    user=user, 
                    defaults={'user_type': 'client'}
                )
                
                user_type = user_profile.user_type
                
                if user_type == 'creator':
                    profile, created = CreatorProfile.objects.get_or_create(
                        user=user,
                        defaults={
                            'creator_type': 'other',
                            'experience_level': 'beginner',
                            'available_for_commissions': True
                        }
                    )
                    if created:
                        created_count['creator'] += 1
                        self.stdout.write(f'Created CreatorProfile for {user.username}')
                    elif force:
                        # Update existing profile with defaults if needed
                        if not profile.creator_type:
                            profile.creator_type = 'other'
                        if not profile.experience_level:
                            profile.experience_level = 'beginner'
                        profile.save()
                        updated_count['creator'] += 1
                        self.stdout.write(f'Updated CreatorProfile for {user.username}')
                
                elif user_type == 'freelancer':
                    profile, created = FreelancerProfile.objects.get_or_create(
                        user=user,
                        defaults={
                            'title': 'Freelancer',
                            'hourly_rate': 25.00,
                            'availability': 'Part-time',
                            'skill_level': 'intermediate'
                        }
                    )
                    if created:
                        created_count['freelancer'] += 1
                        self.stdout.write(f'Created FreelancerProfile for {user.username}')
                    elif force:
                        # Update existing profile with defaults if needed
                        if not profile.title:
                            profile.title = 'Freelancer'
                        if profile.hourly_rate == 0:
                            profile.hourly_rate = 25.00
                        profile.save()
                        updated_count['freelancer'] += 1
                        self.stdout.write(f'Updated FreelancerProfile for {user.username}')
                
                elif user_type == 'client':
                    profile, created = ClientProfile.objects.get_or_create(
                        user=user,
                        defaults={
                            'client_type': 'individual',
                            'company_size': 'solo'
                        }
                    )
                    if created:
                        created_count['client'] += 1
                        self.stdout.write(f'Created ClientProfile for {user.username}')
                    elif force:
                        # Update existing profile with defaults if needed
                        if not profile.client_type:
                            profile.client_type = 'individual'
                        if not profile.company_size:
                            profile.company_size = 'solo'
                        profile.save()
                        updated_count['client'] += 1
                        self.stdout.write(f'Updated ClientProfile for {user.username}')
                        
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error processing user {user.username}: {e}')
                )
        
        # Summary
        self.stdout.write(
            self.style.SUCCESS(
                f'\nSummary:\n'
                f'Created CreatorProfiles: {created_count["creator"]}\n'
                f'Created FreelancerProfiles: {created_count["freelancer"]}\n'
                f'Created ClientProfiles: {created_count["client"]}\n'
                f'Updated CreatorProfiles: {updated_count["creator"]}\n'
                f'Updated FreelancerProfiles: {updated_count["freelancer"]}\n'
                f'Updated ClientProfiles: {updated_count["client"]}\n'
                f'Total users processed: {users.count()}'
            )
        )
