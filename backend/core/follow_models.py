# backend/core/follow_models.py
import uuid
from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils import timezone


class Follow(models.Model):
    """Model representing a follow relationship between users"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    follower = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='following_set',
        help_text="The user who is following"
    )
    followed = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='followers_set',
        help_text="The user being followed"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Optional fields for future features
    is_active = models.BooleanField(default=True)
    notification_sent = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ('follower', 'followed')
        indexes = [
            models.Index(fields=['follower', 'created_at']),
            models.Index(fields=['followed', 'created_at']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']
    
    def clean(self):
        """Validate that users cannot follow themselves"""
        if self.follower == self.followed:
            raise ValidationError("Users cannot follow themselves.")
    
    def save(self, *args, **kwargs):
        """Override save to run validation"""
        self.clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.follower.username} follows {self.followed.username}"


class FollowNotification(models.Model):
    """Model for storing follow notifications"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    follow = models.OneToOneField(
        Follow, 
        on_delete=models.CASCADE, 
        related_name='notification'
    )
    recipient = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='follow_notifications'
    )
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['recipient', 'is_read', 'created_at']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
    
    def __str__(self):
        return f"Follow notification: {self.follow.follower.username} → {self.recipient.username}"


# Add methods to User model via monkey patching
def get_followers_count(self):
    """Get the number of followers for this user"""
    return self.followers_set.filter(is_active=True).count()

def get_following_count(self):
    """Get the number of users this user is following"""
    return self.following_set.filter(is_active=True).count()

def get_followers(self):
    """Get QuerySet of users who follow this user"""
    return User.objects.filter(
        following_set__followed=self,
        following_set__is_active=True
    ).distinct()

def get_following(self):
    """Get QuerySet of users this user is following"""
    return User.objects.filter(
        followers_set__follower=self,
        followers_set__is_active=True
    ).distinct()

def is_following(self, user):
    """Check if this user is following another user"""
    if self == user:
        return False
    return self.following_set.filter(
        followed=user, 
        is_active=True
    ).exists()

def is_followed_by(self, user):
    """Check if this user is followed by another user"""
    if self == user:
        return False
    return self.followers_set.filter(
        follower=user, 
        is_active=True
    ).exists()

def follow(self, user):
    """Follow another user and create notification"""
    if self == user:
        raise ValidationError("Users cannot follow themselves.")
    
    follow_obj, created = Follow.objects.get_or_create(
        follower=self,
        followed=user,
        defaults={'is_active': True}
    )
    
    if not created and not follow_obj.is_active:
        follow_obj.is_active = True
        follow_obj.save(update_fields=['is_active'])
        created = True
    
    # Create notification if this is a new follow
    if created:
        try:
            from .notification_utils import create_follow_notification
            create_follow_notification(self, user)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to create follow notification: {e}")
    
    return follow_obj, created

def unfollow(self, user):
    """Unfollow another user"""
    try:
        follow_obj = Follow.objects.get(
            follower=self,
            followed=user,
            is_active=True
        )
        follow_obj.is_active = False
        follow_obj.save(update_fields=['is_active'])
        return True
    except Follow.DoesNotExist:
        return False

# Attach methods to User model
User.add_to_class('get_followers_count', get_followers_count)
User.add_to_class('get_following_count', get_following_count)
User.add_to_class('get_followers', get_followers)
User.add_to_class('get_following', get_following)
User.add_to_class('is_following', is_following)
User.add_to_class('is_followed_by', is_followed_by)
User.add_to_class('follow', follow)
User.add_to_class('unfollow', unfollow)
