from core.models import FreelancerProfile, UserProfile

print(f'Total freelancer profiles: {FreelancerProfile.objects.count()}')
print(f'Available freelancer profiles: {FreelancerProfile.objects.filter(is_available=True).count()}')

print('\nFreelancer profiles:')
for profile in FreelancerProfile.objects.all()[:10]:
    user = profile.user
    userprofile = getattr(user, 'userprofile', None)
    print(f'- {user.username} ({user.first_name} {user.last_name})')
    print(f'  Title: {profile.title}')
    print(f'  Available: {profile.is_available}')
    print(f'  User type: {userprofile.user_type if userprofile else "No profile"}')
    print(f'  Skills: {userprofile.skills if userprofile else "None"}')
    print()

print('\nUsers with creator type:')
creator_profiles = UserProfile.objects.filter(user_type='creator')
print(f'Total creators: {creator_profiles.count()}')
for profile in creator_profiles:
    print(f'- {profile.user.username}: {profile.headline or "No headline"}')
