import json
from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .models import UserProfile


class PublicProfileAPITestCase(APITestCase):
    """Test cases for the public profiles API endpoint"""
    
    def setUp(self):
        """Set up test data"""
        # Create test users
        self.user1 = User.objects.create_user(
            username='testuser1',
            email='test1@example.com',
            first_name='Test',
            last_name='User1'
        )
        self.user2 = User.objects.create_user(
            username='TestUser2',  # Mixed case to test case-insensitive lookup
            email='test2@example.com',
            first_name='Test',
            last_name='User2'
        )
        
        # Create profiles
        self.profile1 = UserProfile.objects.create(
            user=self.user1,
            bio='Test bio for user 1',
            skills='Python, Django, JavaScript',
            headline='Software Developer',
            location='New York, USA'
        )
        
        self.profile2 = UserProfile.objects.create(
            user=self.user2,
            bio='Test bio for user 2',
            skills='React, Node.js, TypeScript',
            headline='Frontend Developer',
            location='San Francisco, USA'
        )
    
    def test_get_existing_user_profile_success(self):
        """Test GET /api/public-profiles/<existing_username>/ returns 200 with stats"""
        url = reverse('publicuserprofile-detail', kwargs={'user__username': 'testuser1'})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Check basic fields
        self.assertEqual(data['username'], 'testuser1')
        self.assertEqual(data['display_name'], 'Test User1')
        self.assertEqual(data['bio'], 'Test bio for user 1')
        self.assertEqual(data['headline'], 'Software Developer')
        self.assertEqual(data['location'], 'New York, USA')
        
        # Check skills list
        self.assertIn('skills_list', data)
        self.assertIsInstance(data['skills_list'], list)
        self.assertIn('Python', data['skills_list'])
        self.assertIn('Django', data['skills_list'])
        
        # Check stats object
        self.assertIn('stats', data)
        stats = data['stats']
        self.assertIn('followers_count', stats)
        self.assertIn('following_count', stats)
        self.assertIn('projects_count', stats)
        self.assertIn('is_following', stats)
        
        # Verify data types
        self.assertIsInstance(stats['followers_count'], int)
        self.assertIsInstance(stats['following_count'], int)
        self.assertIsInstance(stats['projects_count'], int)
        self.assertIsInstance(stats['is_following'], bool)
    
    def test_get_existing_user_case_insensitive(self):
        """Test case-insensitive username lookup"""
        # Test lowercase lookup for mixed case username
        url = reverse('publicuserprofile-detail', kwargs={'user__username': 'testuser2'})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['username'], 'TestUser2')  # Original case preserved
        
        # Test uppercase lookup
        url = reverse('publicuserprofile-detail', kwargs={'user__username': 'TESTUSER2'})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['username'], 'TestUser2')  # Original case preserved
    
    def test_get_nonexistent_user_returns_404(self):
        """Test GET /api/public-profiles/<missing>/ returns 404"""
        url = reverse('publicuserprofile-detail', kwargs={'user__username': 'nonexistentuser'})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_profile_auto_creation(self):
        """Test that profiles are auto-created for users without profiles"""
        # Create user without profile
        user_without_profile = User.objects.create_user(
            username='noprofile',
            email='noprofile@example.com'
        )
        
        url = reverse('publicuserprofile-detail', kwargs={'user__username': 'noprofile'})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['username'], 'noprofile')
        
        # Verify profile was created
        profile = UserProfile.objects.get(user=user_without_profile)
        self.assertEqual(profile.user_type, 'client')  # Default value
    
    def test_inactive_user_returns_404(self):
        """Test that inactive users return 404"""
        self.user1.is_active = False
        self.user1.save()
        
        url = reverse('publicuserprofile-detail', kwargs={'user__username': 'testuser1'})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_staff_user_returns_404(self):
        """Test that staff users return 404"""
        self.user1.is_staff = True
        self.user1.save()
        
        url = reverse('publicuserprofile-detail', kwargs={'user__username': 'testuser1'})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_null_fields_handled_gracefully(self):
        """Test that null/blank fields are handled gracefully"""
        # Create user with minimal data
        user_minimal = User.objects.create_user(
            username='minimal',
            email='minimal@example.com'
        )
        profile_minimal = UserProfile.objects.create(
            user=user_minimal,
            bio='',  # Empty bio
            skills='',  # Empty skills
            achievements=None  # Null achievements
        )
        
        url = reverse('publicuserprofile-detail', kwargs={'user__username': 'minimal'})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertEqual(data['username'], 'minimal')
        self.assertEqual(data['bio'], '')
        self.assertEqual(data['skills_list'], [])  # Empty list for empty skills
        self.assertEqual(data['recognitions_list'], [])  # Empty list for null achievements
    
    def test_response_performance_fields(self):
        """Test that response contains all expected performance-optimized fields"""
        url = reverse('publicuserprofile-detail', kwargs={'user__username': 'testuser1'})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Check required fields exist
        required_fields = [
            'id', 'username', 'display_name', 'user_type', 'bio', 
            'headline', 'skills_list', 'location', 'website', 
            'member_since', 'portfolio_items', 'recognitions_list', 'stats'
        ]
        
        for field in required_fields:
            self.assertIn(field, data, f"Field '{field}' missing from response")
        
        # Check stats sub-fields
        stats_fields = ['followers_count', 'following_count', 'projects_count', 'is_following']
        for field in stats_fields:
            self.assertIn(field, data['stats'], f"Stats field '{field}' missing from response")


class PublicProfileListAPITestCase(APITestCase):
    """Test cases for the public profiles list API endpoint"""
    
    def setUp(self):
        """Set up test data"""
        self.user1 = User.objects.create_user(username='user1', email='user1@example.com')
        self.user2 = User.objects.create_user(username='user2', email='user2@example.com')
        
        UserProfile.objects.create(user=self.user1, bio='User 1 bio')
        UserProfile.objects.create(user=self.user2, bio='User 2 bio')
    
    def test_get_public_profiles_list(self):
        """Test GET /api/public-profiles/ returns list of profiles"""
        url = reverse('publicuserprofile-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 2)
        
        usernames = [profile['username'] for profile in data]
        self.assertIn('user1', usernames)
        self.assertIn('user2', usernames)
