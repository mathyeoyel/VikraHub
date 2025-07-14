from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField  # for Postgres
from django.urls import reverse # for URL reversing in templates
# This file defines the models for the Vikra Hub project, including user profiles, services, portfolio items, blog posts, team members, and notifications.

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.CharField(max_length=200)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # This model represents a notification for a user, with fields for the message, read status, and timestamps.
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.is_read = False
    def get_absolute_url(self):
        return reverse('notification-detail', kwargs={'pk': self.pk})
    def mark_as_read(self):
        self.is_read = True
        self.save()

    def __str__(self):
        return f"Notification for {self.user.username}: {self.message}"
class UserProfile(models.Model):
    skills = models.CharField(max_length=250, blank=True, help_text="Comma-separated list of skills")
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    bio = models.TextField(blank=True)
    website = models.URLField(blank=True)
    twitter = models.CharField(max_length=100, blank=True)
    instagram = models.CharField(max_length=100, blank=True)
    facebook = models.CharField(max_length=100, blank=True)
    # Add more fields as needed

    def __str__(self):
        return f"{self.user.username}'s profile"

    def get_absolute_url(self):
        return reverse('profile-detail', kwargs={'pk': self.pk})
    def get_skills_list(self):
        return [skill.strip() for skill in self.skills.split(',')] if self.skills else []
    def save(self, *args, **kwargs):
        # Automatically generate skills from the comma-separated string
        if self.skills:
            self.skills = ', '.join([skill.strip() for skill in self.skills.split(',')])
        super().save(*args, **kwargs)

from django.contrib.auth.models import User

def get_profile(self):
    return UserProfile.objects.get_or_create(user=self)[0]
User.profile = property(get_profile)


# Signal to auto-create or update profile when User is created or saved
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
    else:
        UserProfile.objects.get_or_create(user=instance)

class Service(models.Model):
    title = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    icon = models.CharField(max_length=50, blank=True)
    overview = models.TextField(blank=True, help_text="Main overview content for the 'Overview' tab")
    process = models.TextField(blank=True, help_text="Explain the process for the 'Process' tab")
    benefits = models.TextField(blank=True, help_text="List or describe the benefits for the 'Benefits' tab")
    image = models.ImageField(upload_to='services/', blank=True, null=True)

    def __str__(self):
        return self.title

class PortfolioItem(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField()
    image = models.ImageField(upload_to='portfolio/')
    url = models.URLField(blank=True)
    date = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.title

class BlogPost(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    content = models.TextField()
    image = models.ImageField(upload_to='blog/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    published = models.BooleanField(default=False)

    def __str__(self):
        return self.title

class TeamMember(models.Model):
    name = models.CharField(max_length=100)
    role = models.CharField(max_length=100)
    bio = models.TextField(blank=True)
    image = models.ImageField(upload_to='team/', blank=True, null=True)
    linkedin = models.URLField(blank=True)
    twitter = models.URLField(blank=True)
    facebook = models.URLField(blank=True)
    instagram = models.URLField(blank=True)

    def __str__(self):
        return self.name
# This model represents a team member with their name, role, bio, and social media links.