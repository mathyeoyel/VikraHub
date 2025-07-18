from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField  # for Postgres
from django.urls import reverse # for URL reversing in templates
from .cloudinary_utils import validate_cloudinary_url
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
    USER_TYPE_CHOICES = [
        ('client', 'Client'),
        ('freelancer', 'Freelancer'),
        ('seller', 'Seller'),
    ]
    
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='client')
    headline = models.CharField(max_length=150, blank=True, help_text="Professional headline or tagline")
    skills = models.CharField(max_length=250, blank=True, help_text="Comma-separated list of skills")
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    avatar = models.URLField(blank=True, null=True, help_text="Cloudinary URL for avatar image", validators=[validate_cloudinary_url])
    bio = models.TextField(blank=True)
    website = models.URLField(blank=True)
    twitter = models.CharField(max_length=100, blank=True)
    instagram = models.CharField(max_length=100, blank=True)
    facebook = models.CharField(max_length=100, blank=True)
    linkedin = models.CharField(max_length=100, blank=True)
    github = models.CharField(max_length=100, blank=True)
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
        UserProfile.objects.create(user=instance, user_type='client')
    else:
        UserProfile.objects.get_or_create(user=instance, defaults={'user_type': 'client'})

class Service(models.Model):
    title = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    icon = models.CharField(max_length=50, blank=True)
    overview = models.TextField(blank=True, help_text="Main overview content for the 'Overview' tab")
    process = models.TextField(blank=True, help_text="Explain the process for the 'Process' tab")
    benefits = models.TextField(blank=True, help_text="List or describe the benefits for the 'Benefits' tab")
    image = models.URLField(blank=True, null=True, help_text="Cloudinary URL for service image")

    def __str__(self):
        return self.title

class PortfolioItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='portfolio_items', null=True, blank=True)
    title = models.CharField(max_length=100)
    description = models.TextField()
    image = models.URLField(blank=True, null=True, help_text="Cloudinary URL for portfolio image")
    url = models.URLField(blank=True)
    tags = models.CharField(max_length=200, blank=True, help_text="Comma-separated tags")
    date = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.title
        
    def get_tags_list(self):
        return [tag.strip() for tag in self.tags.split(',')] if self.tags else []

class BlogPost(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    content = models.TextField()
    image = models.URLField(blank=True, null=True, help_text="Cloudinary URL for blog post image")
    created_at = models.DateTimeField(auto_now_add=True)
    published = models.BooleanField(default=False)

    def __str__(self):
        return self.title

class TeamMember(models.Model):
    name = models.CharField(max_length=100)
    role = models.CharField(max_length=100)
    bio = models.TextField(blank=True)
    image = models.URLField(blank=True, null=True, help_text="Cloudinary URL for team member image")
    linkedin = models.URLField(blank=True)
    twitter = models.URLField(blank=True)
    facebook = models.URLField(blank=True)
    instagram = models.URLField(blank=True)

    def __str__(self):
        return self.name
# This model represents a team member with their name, role, bio, and social media links.


# Creative Assets Marketplace Models
class AssetCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)
    
    class Meta:
        verbose_name_plural = "Asset Categories"
    
    def __str__(self):
        return self.name

class CreativeAsset(models.Model):
    ASSET_TYPES = [
        ('graphic', 'Graphic Design'),
        ('template', 'Template'),
        ('ui_kit', 'UI Kit'),
        ('icon_set', 'Icon Set'),
        ('illustration', 'Illustration'),
        ('photo', 'Photography'),
        ('vector', 'Vector Art'),
        ('mockup', 'Mockup'),
        ('font', 'Font'),
        ('other', 'Other'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assets')
    category = models.ForeignKey(AssetCategory, on_delete=models.CASCADE)
    asset_type = models.CharField(max_length=20, choices=ASSET_TYPES)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Asset files - using Cloudinary URLs for deployment compatibility
    preview_image = models.URLField(blank=True, null=True, help_text="Cloudinary URL for preview image", validators=[validate_cloudinary_url])
    asset_files = models.URLField(blank=True, null=True, help_text="Cloudinary URL for asset files (ZIP or individual files)", validators=[validate_cloudinary_url])
    
    # Metadata
    tags = models.CharField(max_length=500, help_text="Comma-separated tags")
    software_used = models.CharField(max_length=200, blank=True, help_text="Software requirements")
    file_formats = models.CharField(max_length=200, blank=True, help_text="Included file formats")
    
    # Status and metrics
    is_active = models.BooleanField(default=True)
    downloads = models.PositiveIntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    review_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title
    
    def get_tags_list(self):
        return [tag.strip() for tag in self.tags.split(',')] if self.tags else []

class AssetPurchase(models.Model):
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='asset_purchases')
    asset = models.ForeignKey(CreativeAsset, on_delete=models.CASCADE)
    purchase_date = models.DateTimeField(auto_now_add=True)
    price_paid = models.DecimalField(max_digits=10, decimal_places=2)
    download_count = models.PositiveIntegerField(default=0)
    max_downloads = models.PositiveIntegerField(default=5)  # Limit downloads
    
    class Meta:
        unique_together = ['buyer', 'asset']
    
    def __str__(self):
        return f"{self.buyer.username} purchased {self.asset.title}"

class AssetReview(models.Model):
    asset = models.ForeignKey(CreativeAsset, on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.PositiveIntegerField(choices=[(i, i) for i in range(1, 6)])  # 1-5 stars
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['asset', 'reviewer']
    
    def __str__(self):
        return f"{self.reviewer.username} - {self.rating} stars for {self.asset.title}"


# Freelancer Booking System Models
class FreelancerProfile(models.Model):
    SKILL_LEVELS = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('expert', 'Expert'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='freelancer_profile')
    title = models.CharField(max_length=200, help_text="Professional title")
    hourly_rate = models.DecimalField(max_digits=8, decimal_places=2)
    availability = models.CharField(max_length=100, help_text="e.g., Full-time, Part-time, Weekends")
    skill_level = models.CharField(max_length=20, choices=SKILL_LEVELS)
    
    # Portfolio and experience
    years_experience = models.PositiveIntegerField(default=0)
    portfolio_url = models.URLField(blank=True)
    resume = models.FileField(upload_to='freelancer/resumes/', blank=True)
    
    # Ratings and reviews
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_jobs = models.PositiveIntegerField(default=0)
    completed_jobs = models.PositiveIntegerField(default=0)
    
    is_available = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"
    
    @property
    def success_rate(self):
        if self.total_jobs == 0:
            return 0
        return (self.completed_jobs / self.total_jobs) * 100

class ProjectCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    class Meta:
        verbose_name_plural = "Project Categories"
    
    def __str__(self):
        return self.name

class Project(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open for Applications'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('disputed', 'Disputed'),
    ]
    
    BUDGET_TYPES = [
        ('fixed', 'Fixed Price'),
        ('hourly', 'Hourly Rate'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posted_projects')
    category = models.ForeignKey(ProjectCategory, on_delete=models.CASCADE)
    
    # Budget information
    budget_type = models.CharField(max_length=10, choices=BUDGET_TYPES)
    budget_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    budget_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Project details
    deadline = models.DateField(null=True, blank=True)
    required_skills = models.CharField(max_length=500, help_text="Comma-separated skills")
    experience_level = models.CharField(max_length=20, choices=FreelancerProfile.SKILL_LEVELS)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    selected_freelancer = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, 
        related_name='assigned_projects'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title
    
    def get_required_skills_list(self):
        return [skill.strip() for skill in self.required_skills.split(',')] if self.required_skills else []

class ProjectApplication(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
    ]
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='applications')
    freelancer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='project_applications')
    
    # Application details
    cover_letter = models.TextField()
    proposed_rate = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    estimated_duration = models.CharField(max_length=100, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    applied_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['project', 'freelancer']
    
    def __str__(self):
        return f"{self.freelancer.username} applied for {self.project.title}"

class ProjectContract(models.Model):
    project = models.OneToOneField(Project, on_delete=models.CASCADE)
    freelancer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='contracts')
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='client_contracts')
    
    # Contract terms
    agreed_rate = models.DecimalField(max_digits=10, decimal_places=2)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    
    # Payment and completion
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_completed = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Contract: {self.project.title} - {self.freelancer.username}"

class ProjectReview(models.Model):
    REVIEW_TYPES = [
        ('client_to_freelancer', 'Client to Freelancer'),
        ('freelancer_to_client', 'Freelancer to Client'),
    ]
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_reviews')
    reviewee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_reviews')
    
    review_type = models.CharField(max_length=25, choices=REVIEW_TYPES)
    rating = models.PositiveIntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['project', 'reviewer', 'reviewee']
    
    def __str__(self):
        return f"{self.reviewer.username} reviewed {self.reviewee.username} - {self.rating} stars"