# backend/create_test_users.py
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
django.setup()

from django.contrib.auth.models import User

def create_test_users():
    # Create test users if they don't exist
    users_data = [
        {'username': 'alice_dev', 'email': 'alice@example.com', 'first_name': 'Alice', 'last_name': 'Developer', 'password': 'testpass123'},
        {'username': 'bob_designer', 'email': 'bob@example.com', 'first_name': 'Bob', 'last_name': 'Designer', 'password': 'testpass123'},
        {'username': 'charlie_writer', 'email': 'charlie@example.com', 'first_name': 'Charlie', 'last_name': 'Writer', 'password': 'testpass123'},
        {'username': 'diana_marketer', 'email': 'diana@example.com', 'first_name': 'Diana', 'last_name': 'Marketer', 'password': 'testpass123'},
    ]
    
    created_users = []
    for user_data in users_data:
        user, created = User.objects.get_or_create(
            username=user_data['username'],
            defaults={
                'email': user_data['email'],
                'first_name': user_data['first_name'],
                'last_name': user_data['last_name']
            }
        )
        if created:
            user.set_password(user_data['password'])
            user.save()
            print(f"✅ Created user: {user.username}")
        else:
            print(f"👤 User already exists: {user.username}")
        created_users.append(user)
    
    return created_users

if __name__ == '__main__':
    print("🚀 Creating test users...")
    users = create_test_users()
    print(f"\n📊 Total users in database: {User.objects.count()}")
    print("\n🧪 Test users ready for follow and messaging tests!")
    print("\nTest user credentials:")
    print("Username: alice_dev, Password: testpass123")
    print("Username: bob_designer, Password: testpass123") 
    print("Username: charlie_writer, Password: testpass123")
    print("Username: diana_marketer, Password: testpass123")
