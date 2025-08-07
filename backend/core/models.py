from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField  # for Postgres
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.urls import reverse # for URL reversing in templates
from django.db.models.signals import post_save
from django.dispatch import receiver

# Add Django Allauth signal import
try:
    from allauth.account.signals import user_signed_up
    ALLAUTH_AVAILABLE = True
except ImportError:
    ALLAUTH_AVAILABLE = False
from django.utils.text import slugify
from django.utils import timezone
from django.utils.crypto import get_random_string
import uuid
from .cloudinary_utils import validate_cloudinary_url

# Import follow system models
from .follow_models import Follow, FollowNotification

# This file defines the models for the Vikra Hub project, including user profiles, services, portfolio items, blog posts, team members, and notifications.

class Notification(models.Model):
    """
    Enhanced notification model with support for generic foreign keys and structured events
    """
    # Recipient of the notification
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    
    # Actor who triggered the notification (optional for system notifications)
    actor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications_sent', null=True, blank=True)
    
    # Action/event type (message, follow, like, comment, reaction, reply, etc.)
    verb = models.CharField(max_length=50, db_index=True)
    
    # Generic foreign key to any model (message, post, comment, etc.)
    target_content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    target_object_id = models.PositiveIntegerField(null=True, blank=True)
    target = GenericForeignKey('target_content_type', 'target_object_id')
    
    # Additional data as JSON (message preview, reaction type, etc.)
    payload = models.JSONField(default=dict, blank=True)
    
    # Legacy message field for backward compatibility
    message = models.CharField(max_length=200, blank=True)
    
    # Status
    is_read = models.BooleanField(default=False, db_index=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['verb', '-created_at']),
        ]
    
    def __str__(self):
        actor_name = self.actor.username if self.actor else "System"
        return f"{actor_name} {self.verb} → {self.user.username}"
    
    def get_absolute_url(self):
        return reverse('notification-detail', kwargs={'pk': self.pk})
    
    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            self.save(update_fields=['is_read', 'updated_at'])
    
    @property
    def title(self):
        """Generate a human-readable title based on verb and actor"""
        if not self.actor:
            return self.message or "System notification"
            
        actor_name = self.actor.get_full_name() or self.actor.username
        
        verb_templates = {
            'message': f"{actor_name} sent you a message",
            'follow': f"{actor_name} started following you", 
            'like': f"{actor_name} liked your post",
            'comment': f"{actor_name} commented on your post",
            'reaction': f"{actor_name} reacted to your message",
            'reply': f"{actor_name} replied to your message",
            'mention': f"{actor_name} mentioned you",
        }
        
        return verb_templates.get(self.verb, f"{actor_name} {self.verb}")


class Device(models.Model):
    """
    Store push notification tokens for users across different platforms
    """
    PLATFORM_CHOICES = [
        ('web', 'Web'),
        ('ios', 'iOS'),
        ('android', 'Android'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='devices')
    token = models.TextField(unique=True)  # FCM token or web push endpoint
    platform = models.CharField(max_length=10, choices=PLATFORM_CHOICES)
    
    # Additional data for web push (keys, endpoint)
    auth_key = models.CharField(max_length=255, blank=True)
    p256dh_key = models.CharField(max_length=255, blank=True)
    endpoint = models.TextField(blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_used = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'token']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['platform', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.platform} device"


class EmailVerification(models.Model):
    """
    Email verification tokens for user account activation
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_verifications')
    email = models.EmailField()
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['email', 'is_verified']),
        ]
    
    def __str__(self):
        return f"Email verification for {self.email}"
    
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    def verify(self):
        """Mark the email as verified"""
        if not self.is_expired():
            self.is_verified = True
            self.verified_at = timezone.now()
            self.save()
            
            # Activate the user account
            self.user.is_active = True
            self.user.save()
            
            return True
        return False
    
    @classmethod
    def create_for_user(cls, user, email=None):
        """Create a new verification token for a user"""
        from datetime import timedelta
        
        email = email or user.email
        expires_at = timezone.now() + timedelta(days=3)  # 3 days expiry
        
        return cls.objects.create(
            user=user,
            email=email,
            expires_at=expires_at
        )


class UserProfile(models.Model):
    USER_TYPE_CHOICES = [
        ('client', 'Client'),
        ('freelancer', 'Freelancer'),
        ('creator', 'Creator'),
    ]
    
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='client')
    headline = models.CharField(max_length=150, blank=True, help_text="Professional headline or tagline")
    skills = models.CharField(max_length=250, blank=True, help_text="Comma-separated list of skills")
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    avatar = models.URLField(blank=True, null=True, help_text="Cloudinary URL for avatar image", validators=[validate_cloudinary_url])
    cover_photo = models.URLField(blank=True, null=True, help_text="Cloudinary URL for cover photo", validators=[validate_cloudinary_url])
    bio = models.TextField(blank=True)
    location = models.CharField(max_length=100, blank=True, help_text="City, Country or general location")
    website = models.URLField(blank=True)
    twitter = models.CharField(max_length=100, blank=True)
    instagram = models.CharField(max_length=100, blank=True)
    facebook = models.CharField(max_length=100, blank=True)
    linkedin = models.CharField(max_length=100, blank=True)
    github = models.CharField(max_length=100, blank=True)
    achievements = models.TextField(blank=True, help_text="Awards, recognitions, and notable achievements")
    services_offered = models.TextField(blank=True, help_text="Services and commissions offered")
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
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    content = models.TextField()
    excerpt = models.TextField(blank=True, max_length=300, help_text="Brief description for previews")
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blog_posts', null=True, blank=True)
    image = models.URLField(blank=True, null=True, help_text="Cloudinary URL for blog post image")
    
    # Categories and tags
    category = models.CharField(max_length=50, blank=True)
    tags = models.CharField(max_length=500, blank=True, help_text="Comma-separated tags")
    
    # Publishing settings
    published = models.BooleanField(default=False)
    allow_comments = models.BooleanField(default=True)
    
    # Engagement metrics
    like_count = models.PositiveIntegerField(default=0)
    comment_count = models.PositiveIntegerField(default=0)
    view_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            while BlogPost.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)
    
    def get_tags_list(self):
        return [tag.strip() for tag in self.tags.split(',')] if self.tags else []
    
    def increment_like_count(self):
        self.like_count += 1
        self.save(update_fields=['like_count'])
    
    def decrement_like_count(self):
        self.like_count = max(0, self.like_count - 1)
        self.save(update_fields=['like_count'])

# Blog likes and comments
class BlogLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blog_likes')
    blog_post = models.ForeignKey(BlogPost, on_delete=models.CASCADE, related_name='blog_likes')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'blog_post')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} likes {self.blog_post.title[:30]}"

class BlogComment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blog_comments')
    blog_post = models.ForeignKey(BlogPost, on_delete=models.CASCADE, related_name='blog_comments')
    content = models.TextField()
    
    # Optional: Parent comment for reply functionality
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    
    # Engagement for comments
    like_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.user.username} commented on {self.blog_post.title[:30]}"

class BlogCommentLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blog_comment_likes')
    comment = models.ForeignKey(BlogComment, on_delete=models.CASCADE, related_name='comment_likes')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'comment')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} likes blog comment by {self.comment.user.username}"

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
    
    CURRENCY_CHOICES = [
        ('SSP', 'South Sudanese Pound'),
        ('USD', 'US Dollar'),
        ('EUR', 'Euro'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assets')
    category = models.ForeignKey(AssetCategory, on_delete=models.CASCADE)
    asset_type = models.CharField(max_length=20, choices=ASSET_TYPES)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Leave empty for free assets")
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='SSP')
    
    # Asset files - using Cloudinary URLs for deployment compatibility
    preview_image = models.URLField(blank=True, null=True, help_text="Cloudinary URL for preview image", validators=[validate_cloudinary_url])
    asset_files = models.URLField(blank=True, null=True, help_text="Cloudinary URL for asset files (ZIP or individual files) - Optional", validators=[validate_cloudinary_url])
    
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

class CreatorProfile(models.Model):
    CREATOR_TYPES = [
        ('artist', 'Visual Artist'),
        ('photographer', 'Photographer'),
        ('designer', 'Graphic Designer'),
        ('writer', 'Writer/Storyteller'),
        ('musician', 'Musician'),
        ('filmmaker', 'Filmmaker'),
        ('digital_artist', 'Digital Artist'),
        ('traditional_artist', 'Traditional Artist'),
        ('other', 'Other Creative'),
    ]
    
    EXPERIENCE_LEVELS = [
        ('beginner', 'Beginner (0-2 years)'),
        ('intermediate', 'Intermediate (3-5 years)'),
        ('advanced', 'Advanced (6-10 years)'),
        ('expert', 'Expert (10+ years)'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='creator_profile')
    creator_type = models.CharField(max_length=50, choices=CREATOR_TYPES, help_text="Primary creative field")
    artistic_style = models.CharField(max_length=200, blank=True, help_text="Description of artistic style or approach")
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_LEVELS, default='beginner')
    
    # Portfolio and showcase
    portfolio_url = models.URLField(blank=True, help_text="Link to external portfolio")
    featured_work = models.URLField(blank=True, help_text="Cloudinary URL for featured artwork", validators=[validate_cloudinary_url])
    art_statement = models.TextField(blank=True, help_text="Artist statement or creative philosophy")
    
    # Professional details
    years_active = models.PositiveIntegerField(default=0, help_text="Years active as a creator")
    exhibitions = models.TextField(blank=True, help_text="Notable exhibitions, shows, or features")
    awards = models.TextField(blank=True, help_text="Awards and recognitions")
    
    # Availability and preferences
    available_for_commissions = models.BooleanField(default=True)
    commission_types = models.CharField(max_length=300, blank=True, help_text="Types of commissions accepted")
    price_range = models.CharField(max_length=100, blank=True, help_text="Typical price range for work")
    
    # Social proof
    followers_count = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.get_creator_type_display()}"
    
    class Meta:
        verbose_name = "Creator Profile"
        verbose_name_plural = "Creator Profiles"

class ClientProfile(models.Model):
    CLIENT_TYPES = [
        ('individual', 'Individual'),
        ('business', 'Business/Company'),
        ('nonprofit', 'Non-Profit Organization'),
        ('government', 'Government Agency'),
        ('media', 'Media Organization'),
        ('agency', 'Creative Agency'),
        ('startup', 'Startup'),
        ('other', 'Other'),
    ]
    
    COMPANY_SIZES = [
        ('solo', 'Solo/Individual'),
        ('small', 'Small (2-10 employees)'),
        ('medium', 'Medium (11-50 employees)'),
        ('large', 'Large (51-200 employees)'),
        ('enterprise', 'Enterprise (200+ employees)'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='client_profile')
    client_type = models.CharField(max_length=20, choices=CLIENT_TYPES, default='individual')
    company_name = models.CharField(max_length=200, blank=True, help_text="Organization or company name")
    company_size = models.CharField(max_length=20, choices=COMPANY_SIZES, default='solo')
    industry = models.CharField(max_length=100, blank=True, help_text="Industry or sector")
    
    # Contact and location
    business_address = models.TextField(blank=True)
    contact_person = models.CharField(max_length=100, blank=True, help_text="Primary contact person")
    phone_number = models.CharField(max_length=20, blank=True)
    
    # Project and budget preferences
    typical_budget_range = models.CharField(max_length=100, blank=True, help_text="Typical project budget range")
    project_types = models.TextField(blank=True, help_text="Types of projects typically commissioned")
    preferred_communication = models.CharField(max_length=100, blank=True, help_text="Preferred communication methods")
    
    # Business details
    business_registration = models.CharField(max_length=100, blank=True, help_text="Business registration number")
    tax_id = models.CharField(max_length=50, blank=True, help_text="Tax identification number")
    
    # Metrics
    projects_posted = models.PositiveIntegerField(default=0)
    projects_completed = models.PositiveIntegerField(default=0)
    total_spent = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Status
    is_verified = models.BooleanField(default=False)
    payment_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        if self.company_name:
            return f"{self.company_name} ({self.user.username})"
        return f"{self.user.username} - {self.get_client_type_display()}"
    
    @property
    def completion_rate(self):
        if self.projects_posted == 0:
            return 0
        return (self.projects_completed / self.projects_posted) * 100
    
    class Meta:
        verbose_name = "Client Profile"
        verbose_name_plural = "Client Profiles"

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


def create_specialized_profile(user, user_type):
    """Helper function to create specialized profiles based on user_type"""
    try:
        if user_type == 'creator':
            # Import here to avoid circular imports
            CreatorProfile.objects.get_or_create(user=user, defaults={
                'creator_type': 'other',
                'experience_level': 'beginner',
                'available_for_commissions': True
            })
        elif user_type == 'freelancer':
            # Import here to avoid circular imports
            FreelancerProfile.objects.get_or_create(user=user, defaults={
                'title': 'Freelancer',
                'hourly_rate': 25.00,
                'availability': 'Part-time',
                'skill_level': 'intermediate'
            })
        elif user_type == 'client':
            # Import here to avoid circular imports
            ClientProfile.objects.get_or_create(user=user, defaults={
                'client_type': 'individual',
                'company_size': 'solo'
            })
    except Exception as e:
        print(f"Error creating specialized profile for {user.username}: {e}")

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        # Ensure new users are inactive until email verification
        if instance.is_active:
            instance.is_active = False
            instance.save(update_fields=['is_active'])
        
        profile = UserProfile.objects.create(user=instance, user_type='client')
        # Create specialized profile based on user_type
        create_specialized_profile(instance, profile.user_type)
    else:
        profile, created = UserProfile.objects.get_or_create(user=instance, defaults={'user_type': 'client'})
        if not created:
            # If profile already exists, ensure specialized profile exists
            create_specialized_profile(instance, profile.user_type)

# Social Media Models for Posts, Likes, and Comments
class Post(models.Model):
    POST_CATEGORIES = [
        ('general', 'General'),
        ('art', 'Art & Design'),
        ('music', 'Music'),
        ('photography', 'Photography'),
        ('writing', 'Writing'),
        ('tech', 'Technology'),
        ('business', 'Business'),
        ('lifestyle', 'Lifestyle'),
        ('education', 'Education'),
        ('entertainment', 'Entertainment'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    title = models.CharField(max_length=200)
    content = models.TextField()
    category = models.CharField(max_length=20, choices=POST_CATEGORIES, default='general')
    tags = models.CharField(max_length=500, blank=True, help_text="Comma-separated tags")
    
    # Privacy settings
    is_public = models.BooleanField(default=True)
    allow_comments = models.BooleanField(default=True)
    allow_sharing = models.BooleanField(default=True)
    
    # Engagement metrics
    like_count = models.PositiveIntegerField(default=0)
    comment_count = models.PositiveIntegerField(default=0)
    share_count = models.PositiveIntegerField(default=0)
    view_count = models.PositiveIntegerField(default=0)
    
    # Optional media
    image = models.URLField(blank=True, null=True, help_text="Cloudinary URL for post image", validators=[validate_cloudinary_url])
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username}: {self.title[:50]}"
    
    def get_tags_list(self):
        return [tag.strip() for tag in self.tags.split(',')] if self.tags else []
    
    def increment_like_count(self):
        self.like_count += 1
        self.save(update_fields=['like_count'])
    
    def decrement_like_count(self):
        self.like_count = max(0, self.like_count - 1)
        self.save(update_fields=['like_count'])
    
    def increment_comment_count(self):
        self.comment_count += 1
        self.save(update_fields=['comment_count'])
    
    def decrement_comment_count(self):
        self.comment_count = max(0, self.comment_count - 1)
        self.save(update_fields=['comment_count'])

class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='likes')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'post')  # Prevent duplicate likes
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} likes {self.post.title[:30]}"

class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    
    # Optional: Parent comment for reply functionality
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    
    # Engagement for comments
    like_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.user.username} commented on {self.post.title[:30]}"
    
    @property
    def is_reply(self):
        return self.parent is not None

class CommentLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comment_likes')
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='comment_likes')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'comment')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} likes comment by {self.comment.user.username}"

# Add likes and comments to BlogPost model
def add_engagement_to_blogpost():
    """Add engagement fields to existing BlogPost model"""
    # We'll update the BlogPost model to include engagement metrics
    pass

@receiver(post_save, sender=UserProfile)
def create_specialized_profile_on_userprofile_save(sender, instance, created, **kwargs):
    """Signal to create specialized profiles when UserProfile is saved"""
    if instance.user and instance.user_type:
        create_specialized_profile(instance.user, instance.user_type)

# Django Allauth signal handler (if available)
if ALLAUTH_AVAILABLE:
    @receiver(user_signed_up)
    def handle_allauth_signup(sender, request, user, **kwargs):
        """
        Handle Django Allauth user signup to ensure email verification
        """
        # Ensure user is inactive until email verification
        if user.is_active:
            user.is_active = False
            user.save(update_fields=['is_active'])
        
        # Create email verification for Django Allauth users
        try:
            verification = EmailVerification.create_for_user(user)
            from .email_utils import send_verification_email
            send_verification_email(user, verification.token)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to create email verification for Django Allauth user: {e}")