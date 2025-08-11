from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    TeamMember, Service, PortfolioItem, BlogPost, UserProfile, Notification, Device,
    AssetCategory, CreativeAsset, AssetPurchase, AssetReview,
    FreelancerProfile, CreatorProfile, ClientProfile, ProjectCategory, Project, 
    ProjectApplication, ProjectContract, ProjectReview,
    Post, Like, Comment, CommentLike, BlogLike, BlogComment, BlogCommentLike
)
from .cloudinary_utils import get_optimized_avatar_url, validate_cloudinary_url
from .asset_utils import validate_asset_price, validate_asset_tags

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    user_type = serializers.CharField(write_only=True, required=False, default='client')
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password', 'user_type', 'date_joined', 'is_staff', 'is_superuser', 'is_active', 'followers_count', 'following_count', 'is_following']
        read_only_fields = ['id', 'date_joined', 'is_staff', 'is_superuser', 'followers_count', 'following_count', 'is_following']
        extra_kwargs = {
            'password': {'write_only': True},
        }
    
    def get_followers_count(self, obj):
        return obj.get_followers_count()
    
    def get_following_count(self, obj):
        return obj.get_following_count()
    
    def get_is_following(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        return user.is_authenticated and user.is_following(obj) if user else False
    
    def create(self, validated_data):
        user_type = validated_data.pop('user_type', 'client')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        
        # Set user as active immediately (email verification disabled)
        user.is_active = True
        user.save()
        
        # Update the user's profile with the user_type (profile created by signal)
        profile = user.userprofile
        profile.user_type = user_type
        profile.save()
        
        # Note: Email verification disabled - users are immediately active
        # TODO: Re-enable email verification later if needed
        
        return user

class PublicUserSerializer(serializers.ModelSerializer):
    """Serializer for public user information (no sensitive data)"""
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'date_joined', 'followers_count', 'following_count', 'is_following']
        read_only_fields = ['id', 'username', 'first_name', 'last_name', 'date_joined', 'followers_count', 'following_count', 'is_following']
    
    def get_followers_count(self, obj):
        return obj.get_followers_count()
    
    def get_following_count(self, obj):
        return obj.get_following_count()
    
    def get_is_following(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        return user.is_authenticated and user.is_following(obj) if user else False

class UserProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', read_only=False, required=False)
    last_name = serializers.CharField(source='user.last_name', read_only=False, required=False)
    email = serializers.EmailField(source='user.email', read_only=False, required=False)
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    
    # Client-specific fields (write-only for updates)
    client_type = serializers.CharField(write_only=True, required=False)
    company_name = serializers.CharField(write_only=True, required=False)
    company_size = serializers.CharField(write_only=True, required=False)
    industry = serializers.CharField(write_only=True, required=False)
    business_address = serializers.CharField(write_only=True, required=False)
    contact_person = serializers.CharField(write_only=True, required=False)
    phone_number = serializers.CharField(write_only=True, required=False)
    typical_budget_range = serializers.CharField(write_only=True, required=False)
    project_types = serializers.CharField(write_only=True, required=False)
    preferred_communication = serializers.CharField(write_only=True, required=False)
    business_registration = serializers.CharField(write_only=True, required=False)
    tax_id = serializers.CharField(write_only=True, required=False)
    
    # Experience fields (for freelancer and creator profiles)
    years_experience = serializers.IntegerField(write_only=True, required=False)
    experience_level = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'user_type', 'avatar', 'cover_photo', 'bio', 'location', 
                 'website', 'twitter', 'instagram', 'facebook', 'linkedin', 'github', 
                 'skills', 'headline', 'achievements', 'services_offered', 
                 'first_name', 'last_name', 'email', 'followers_count', 'following_count', 'is_following',
                 'client_type', 'company_name', 'company_size', 'industry', 
                 'business_address', 'contact_person', 'phone_number', 
                 'typical_budget_range', 'project_types', 'preferred_communication',
                 'business_registration', 'tax_id', 'years_experience', 'experience_level']
        read_only_fields = ['id', 'user', 'followers_count', 'following_count', 'is_following']
    
    def get_followers_count(self, obj):
        return obj.user.get_followers_count()
    
    def get_following_count(self, obj):
        return obj.user.get_following_count()
    
    def get_is_following(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        return user.is_authenticated and user.is_following(obj.user) if user else False
    
    def to_representation(self, instance):
        """Override to include user fields and nested user with context"""
        data = super().to_representation(instance)
        
    def to_representation(self, instance):
        """Override to include user fields and nested user with context"""
        data = super().to_representation(instance)
        
        # Include user fields directly at profile level
        if instance.user:
            data['first_name'] = instance.user.first_name
            data['last_name'] = instance.user.last_name
            data['email'] = instance.user.email
        
        # Serialize user with context for follow information
        user_serializer = UserSerializer(instance.user, context=self.context)
        data['user'] = user_serializer.data
        
        # Add client profile data if user is a client
        if instance.user_type == 'client':
            try:
                client_profile = instance.user.client_profile
                data['client_profile'] = {
                    'client_type': client_profile.client_type,
                    'company_name': client_profile.company_name,
                    'company_size': client_profile.company_size,
                    'industry': client_profile.industry,
                    'business_address': client_profile.business_address,
                    'contact_person': client_profile.contact_person,
                    'phone_number': client_profile.phone_number,
                    'typical_budget_range': client_profile.typical_budget_range,
                    'project_types': client_profile.project_types,
                    'preferred_communication': client_profile.preferred_communication,
                    'business_registration': client_profile.business_registration,
                    'tax_id': client_profile.tax_id,
                    'projects_posted': client_profile.projects_posted,
                    'projects_completed': client_profile.projects_completed,
                    'total_spent': client_profile.total_spent,
                    'is_verified': client_profile.is_verified,
                    'payment_verified': client_profile.payment_verified,
                }
            except AttributeError:
                # Client profile doesn't exist yet
                data['client_profile'] = None
        
        # Add freelancer profile data if user is a freelancer
        if instance.user_type == 'freelancer':
            try:
                freelancer_profile = instance.user.freelancer_profile
                data['freelancer_profile'] = {
                    'years_experience': freelancer_profile.years_experience,
                    'hourly_rate': freelancer_profile.hourly_rate,
                    'availability': freelancer_profile.availability,
                    'skill_level': freelancer_profile.skill_level,
                    'portfolio_url': freelancer_profile.portfolio_url,
                    'rating': freelancer_profile.rating,
                    'total_jobs': freelancer_profile.total_jobs,
                    'completed_jobs': freelancer_profile.completed_jobs,
                    'is_available': freelancer_profile.is_available,
                    'is_verified': freelancer_profile.is_verified,
                }
            except AttributeError:
                # Freelancer profile doesn't exist yet
                data['freelancer_profile'] = None
        
        # Add creator profile data if user is a creator
        if instance.user_type == 'creator':
            try:
                creator_profile = instance.user.creator_profile
                data['creator_profile'] = {
                    'creator_type': creator_profile.creator_type,
                    'artistic_style': creator_profile.artistic_style,
                    'experience_level': creator_profile.experience_level,
                    'portfolio_url': creator_profile.portfolio_url,
                    'featured_work': creator_profile.featured_work,
                    'art_statement': creator_profile.art_statement,
                    'commissions_open': creator_profile.commissions_open,
                    'commission_rates': creator_profile.commission_rates,
                    'cultural_focus': creator_profile.cultural_focus,
                    'rating': creator_profile.rating,
                    'total_commissions': creator_profile.total_commissions,
                    'completed_commissions': creator_profile.completed_commissions,
                }
            except AttributeError:
                # Creator profile doesn't exist yet
                data['creator_profile'] = None
        
        # Add freelancer profile data if user is a freelancer
        if instance.user_type == 'freelancer':
            try:
                freelancer_profile = instance.user.freelancer_profile
                data['freelancer_profile'] = {
                    'years_experience': freelancer_profile.years_experience,
                    'hourly_rate': freelancer_profile.hourly_rate,
                    'availability': freelancer_profile.availability,
                    'skill_level': freelancer_profile.skill_level,
                    'portfolio_url': freelancer_profile.portfolio_url,
                    'rating': freelancer_profile.rating,
                    'total_jobs': freelancer_profile.total_jobs,
                    'completed_jobs': freelancer_profile.completed_jobs,
                    'is_available': freelancer_profile.is_available,
                    'is_verified': freelancer_profile.is_verified,
                }
            except AttributeError:
                # Freelancer profile doesn't exist yet
                data['freelancer_profile'] = None
        
        # Add creator profile data if user is a creator
        if instance.user_type == 'creator':
            try:
                creator_profile = instance.user.creator_profile
                data['creator_profile'] = {
                    'creator_type': creator_profile.creator_type,
                    'artistic_style': creator_profile.artistic_style,
                    'experience_level': creator_profile.experience_level,
                    'portfolio_url': creator_profile.portfolio_url,
                    'featured_work': creator_profile.featured_work,
                    'art_statement': creator_profile.art_statement,
                    'commission_types': creator_profile.commission_types,
                    'pricing_range': creator_profile.pricing_range,
                    'turnaround_time': creator_profile.turnaround_time,
                    'cultural_focus': creator_profile.cultural_focus,
                    'languages_spoken': creator_profile.languages_spoken,
                    'preferred_subjects': creator_profile.preferred_subjects,
                    'materials_used': creator_profile.materials_used,
                    'rating': creator_profile.rating,
                    'total_commissions': creator_profile.total_commissions,
                    'is_available': creator_profile.is_available,
                    'is_verified': creator_profile.is_verified,
                }
            except AttributeError:
                # Creator profile doesn't exist yet
                data['creator_profile'] = None
        
        # Add optimized avatar URLs
        if data.get('avatar'):
            data['avatar_small'] = get_optimized_avatar_url(data['avatar'], size=100)
            data['avatar_medium'] = get_optimized_avatar_url(data['avatar'], size=200)
            data['avatar_large'] = get_optimized_avatar_url(data['avatar'], size=400)
        
        # Add optimized cover photo URLs
        if data.get('cover_photo'):
            data['cover_photo_small'] = get_optimized_avatar_url(data['cover_photo'], size=600)
            data['cover_photo_medium'] = get_optimized_avatar_url(data['cover_photo'], size=1200)
            data['cover_photo_large'] = get_optimized_avatar_url(data['cover_photo'], size=1920)
        
        return data
    
    def validate_avatar(self, value):
        """Validate avatar URL is from Cloudinary"""
        if value:
            validate_cloudinary_url(value)
        return value
    
    def validate_cover_photo(self, value):
        """Validate cover photo URL is from Cloudinary"""
        if value:
            validate_cloudinary_url(value)
        return value
    
    def update(self, instance, validated_data):
        # Extract user fields - handle both direct fields and nested user dict
        user_fields = ['first_name', 'last_name', 'email']
        user_data = {}
        
        # Extract client profile fields
        client_fields = [
            'client_type', 'company_name', 'company_size', 'industry',
            'business_address', 'contact_person', 'phone_number',
            'typical_budget_range', 'project_types', 'preferred_communication',
            'business_registration', 'tax_id'
        ]
        client_data = {}
        
        # Extract experience fields for freelancer and creator profiles
        experience_fields = ['years_experience', 'experience_level']
        experience_data = {}
        
        # Handle direct user fields
        for field in user_fields:
            if field in validated_data:
                user_data[field] = validated_data.pop(field)
        
        # Handle client profile fields
        for field in client_fields:
            if field in validated_data:
                client_data[field] = validated_data.pop(field)
        
        # Handle experience fields
        for field in experience_fields:
            if field in validated_data:
                experience_data[field] = validated_data.pop(field)
        
        # Handle nested user data (from source fields)
        if 'user' in validated_data:
            nested_user_data = validated_data.pop('user')
            if isinstance(nested_user_data, dict):
                user_data.update(nested_user_data)
        
        # Update user fields if any
        if user_data:
            user = instance.user
            for field_name, value in user_data.items():
                setattr(user, field_name, value)
            user.save()
        
        # Update client profile fields if any and user is a client
        if client_data and instance.user_type == 'client':
            from .models import ClientProfile
            client_profile, created = ClientProfile.objects.get_or_create(user=instance.user)
            for field_name, value in client_data.items():
                setattr(client_profile, field_name, value)
            client_profile.save()
        
        # Update freelancer profile experience fields if user is a freelancer
        if experience_data and instance.user_type == 'freelancer':
            from .models import FreelancerProfile
            freelancer_profile, created = FreelancerProfile.objects.get_or_create(user=instance.user)
            if 'years_experience' in experience_data:
                freelancer_profile.years_experience = experience_data['years_experience']
            freelancer_profile.save()
        
        # Update creator profile experience fields if user is a creator
        if experience_data and instance.user_type == 'creator':
            from .models import CreatorProfile
            creator_profile, created = CreatorProfile.objects.get_or_create(user=instance.user)
            if 'experience_level' in experience_data:
                creator_profile.experience_level = experience_data['experience_level']
            creator_profile.save()
        
        # Update profile fields
        for field_name, value in validated_data.items():
            setattr(instance, field_name, value)
        instance.save()
        
        return instance

class PortfolioItemSerializer(serializers.ModelSerializer):
    tags_list = serializers.SerializerMethodField()
    image = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    # Use read-only field for user info (prevents client from setting it)
    user = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = PortfolioItem
        fields = ['id', 'user', 'title', 'description', 'image', 'url', 'tags', 'tags_list', 'date']
        read_only_fields = ['id', 'date', 'user']
    
    def get_user(self, obj):
        """Include user information for ownership detection"""
        if obj.user:
            return {
                'id': obj.user.id,
                'username': obj.user.username,
                'first_name': obj.user.first_name,
                'last_name': obj.user.last_name,
            }
        return None
    
    def get_tags_list(self, obj):
        return obj.get_tags_list()
    
    def create(self, validated_data):
        """Create portfolio item with user set to current user"""
        # Auto-assign owner to current user (user cannot set this)
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Update portfolio item, preserving user ownership"""
        # Don't allow changing the user
        validated_data.pop('user', None)
        return super().update(instance, validated_data)

class PublicUserProfileSerializer(serializers.ModelSerializer):
    """Serializer for public user profiles (only public information)"""
    full_name = serializers.SerializerMethodField()
    member_since = serializers.DateTimeField(source='user.date_joined', read_only=True)
    portfolio_items = serializers.SerializerMethodField()
    client_profile = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'user_type', 'avatar', 'cover_photo', 'bio', 'website', 'headline',
                 'skills', 'location', 'achievements', 'services_offered', 'full_name', 'member_since', 'portfolio_items',
                 'facebook', 'instagram', 'twitter', 'linkedin', 'github', 'client_profile', 
                 'followers_count', 'following_count', 'is_following']
        read_only_fields = ['id', 'user', 'user_type', 'avatar', 'cover_photo', 'bio', 'website', 'headline',
                           'skills', 'location', 'achievements', 'services_offered', 'full_name', 'member_since', 'portfolio_items',
                           'facebook', 'instagram', 'twitter', 'linkedin', 'github', 'client_profile',
                           'followers_count', 'following_count', 'is_following']
    
    def get_followers_count(self, obj):
        return obj.user.get_followers_count()
    
    def get_following_count(self, obj):
        return obj.user.get_following_count()
    
    def get_is_following(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        return user.is_authenticated and user.is_following(obj.user) if user else False
    
    def get_full_name(self, obj):
        """Get user's full name"""
        if obj.user.first_name and obj.user.last_name:
            return f"{obj.user.first_name} {obj.user.last_name}"
        return obj.user.username
    
    def get_client_profile(self, obj):
        """Get client profile data for public viewing (limited fields)"""
        if obj.user_type == 'client':
            try:
                client_profile = obj.user.client_profile
                return {
                    'client_type': client_profile.client_type,
                    'client_type_display': client_profile.get_client_type_display(),
                    'company_name': client_profile.company_name,
                    'company_size': client_profile.company_size,
                    'industry': client_profile.industry,
                    'business_address': client_profile.business_address,
                    'contact_person': client_profile.contact_person,
                    'phone_number': client_profile.phone_number,
                    'typical_budget_range': client_profile.typical_budget_range,
                    'project_types': client_profile.project_types,
                    'preferred_communication': client_profile.preferred_communication,
                    'projects_posted': client_profile.projects_posted,
                    'projects_completed': client_profile.projects_completed,
                    'completion_rate': client_profile.completion_rate,
                    'total_spent': float(client_profile.total_spent) if client_profile.total_spent else 0.0,
                    'is_verified': client_profile.is_verified,
                    'payment_verified': client_profile.payment_verified,
                }
            except:
                return None
        return None
    
    def get_portfolio_items(self, obj):
        """Get user's portfolio items"""
        portfolio_items = obj.user.portfolio_items.all()
        return PortfolioItemSerializer(portfolio_items, many=True).data
    
    def to_representation(self, instance):
        """Override to ensure proper user serialization with context"""
        data = super().to_representation(instance)
        
        # Serialize user with context for follow information
        user_serializer = PublicUserSerializer(instance.user, context=self.context)
        data['user'] = user_serializer.data
        
        return data

class TeamMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamMember
        fields = '__all__'
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {
            'image': {'required': False},
        }

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'
        read_only_fields = ['id', 'slug']

class BlogPostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    tags_list = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    can_comment = serializers.SerializerMethodField()
    time_since_posted = serializers.SerializerMethodField()
    
    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'content', 'excerpt', 'author', 'image',
            'category', 'tags', 'tags_list', 'published', 'allow_comments',
            'like_count', 'comment_count', 'view_count', 'created_at', 'updated_at',
            'is_liked', 'can_comment', 'time_since_posted'
        ]
        read_only_fields = ['id', 'created_at', 'author', 'slug', 'like_count', 'comment_count', 'view_count']
    
    def get_tags_list(self, obj):
        return obj.get_tags_list()
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.blog_likes.filter(user=request.user).exists()
        return False
    
    def get_can_comment(self, obj):
        return obj.allow_comments
    
    def get_time_since_posted(self, obj):
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff < timedelta(minutes=1):
            return "Just now"
        elif diff < timedelta(hours=1):
            return f"{diff.seconds // 60}m ago"
        elif diff < timedelta(days=1):
            return f"{diff.seconds // 3600}h ago"
        elif diff < timedelta(days=7):
            return f"{diff.days}d ago"
        else:
            return obj.created_at.strftime("%b %d, %Y")

class NotificationSerializer(serializers.ModelSerializer):
    """
    Enhanced notification serializer with actor, verb, and payload support
    """
    actor = UserSerializer(read_only=True)
    user = UserSerializer(read_only=True)
    title = serializers.ReadOnlyField()
    target_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'actor', 'verb', 'title', 'message', 'payload',
            'target_name', 'is_read', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'user', 'actor']
    
    def get_target_name(self, obj):
        """Get a string representation of the target object"""
        if obj.target:
            return str(obj.target)
        return None


class DeviceSerializer(serializers.ModelSerializer):
    """
    Serializer for push notification device tokens
    """
    class Meta:
        model = Device
        fields = [
            'id', 'token', 'platform', 'auth_key', 'p256dh_key', 
            'endpoint', 'is_active', 'created_at', 'last_used'
        ]
        read_only_fields = ['id', 'created_at', 'last_used']
    
    def create(self, validated_data):
        # Set the user to the authenticated user
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Update last_used timestamp when token is updated
        from django.utils import timezone
        instance.last_used = timezone.now()
        return super().update(instance, validated_data)


# Creative Assets Marketplace Serializers
class AssetCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetCategory
        fields = '__all__'

class CreativeAssetSerializer(serializers.ModelSerializer):
    seller = UserSerializer(read_only=True)
    category = AssetCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(queryset=AssetCategory.objects.all(), source='category', write_only=True)
    tags_list = serializers.ReadOnlyField(source='get_tags_list')
    file_info = serializers.SerializerMethodField()
    is_purchased = serializers.SerializerMethodField()
    
    class Meta:
        model = CreativeAsset
        fields = '__all__'
        read_only_fields = ['id', 'seller', 'downloads', 'rating', 'review_count', 'created_at', 'updated_at']
    
    def get_file_info(self, obj):
        """Get file information for the asset"""
        if obj.asset_files:
            # Since asset_files is now a URLField, return basic info
            return {
                'name': obj.title + '_assets',  # Use title as name
                'url': obj.asset_files,  # Direct URL
                'type': 'cloudinary_url'
            }
        return None
    
    def get_is_purchased(self, obj):
        """Check if current user has purchased this asset"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.assetpurchase_set.filter(buyer=request.user).exists()
        return False
    
    def validate_price(self, value):
        """Validate asset price"""
        return validate_asset_price(value)
    
    def validate_tags(self, value):
        """Validate and clean asset tags"""
        return validate_asset_tags(value)
    
    def validate_preview_image(self, value):
        """Validate preview image URL"""
        if value:
            validate_cloudinary_url(value)
        return value
    
    def validate_asset_files(self, value):
        """Validate asset files URL"""
        if value:
            validate_cloudinary_url(value)
        return value
    
    def create(self, validated_data):
        """Create asset with seller set to current user"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['seller'] = request.user
        
        # Ensure is_active defaults to True if not provided
        if 'is_active' not in validated_data:
            validated_data['is_active'] = True
            
        return super().create(validated_data)

class AssetPurchaseSerializer(serializers.ModelSerializer):
    buyer = UserSerializer(read_only=True)
    asset = CreativeAssetSerializer(read_only=True)
    can_download = serializers.SerializerMethodField()
    
    class Meta:
        model = AssetPurchase
        fields = '__all__'
        read_only_fields = ['id', 'buyer', 'purchase_date', 'download_count']
    
    def get_can_download(self, obj):
        """Check if user can still download the asset"""
        return obj.download_count < obj.max_downloads

class AssetReviewSerializer(serializers.ModelSerializer):
    reviewer = UserSerializer(read_only=True)
    asset_title = serializers.CharField(source='asset.title', read_only=True)
    
    class Meta:
        model = AssetReview
        fields = '__all__'
        read_only_fields = ['id', 'reviewer', 'created_at']
    
    def create(self, validated_data):
        """Create review with reviewer set to current user"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['reviewer'] = request.user
        return super().create(validated_data)
    
    def validate(self, data):
        """Validate that user has purchased the asset and hasn't reviewed it yet"""
        request = self.context.get('request')
        asset = data.get('asset')
        
        if request and request.user.is_authenticated and asset:
            # Check if user purchased the asset
            if not asset.assetpurchase_set.filter(buyer=request.user).exists():
                raise serializers.ValidationError("You can only review assets you have purchased")
            
            # Check if user already reviewed this asset (only for create)
            if not self.instance and asset.reviews.filter(reviewer=request.user).exists():
                raise serializers.ValidationError("You have already reviewed this asset")
        
        return data


# Freelancer Booking System Serializers
class UserWithProfileSerializer(serializers.ModelSerializer):
    userprofile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 'userprofile']
        read_only_fields = ['id', 'date_joined']

class FreelancerProfileSerializer(serializers.ModelSerializer):
    user = UserWithProfileSerializer(read_only=True)
    success_rate = serializers.ReadOnlyField()
    
    class Meta:
        model = FreelancerProfile
        fields = '__all__'
        read_only_fields = ['id', 'user', 'rating', 'total_jobs', 'completed_jobs', 'created_at']

class CreatorProfileSerializer(serializers.ModelSerializer):
    user = UserWithProfileSerializer(read_only=True)
    creator_type_display = serializers.CharField(source='get_creator_type_display', read_only=True)
    experience_level_display = serializers.CharField(source='get_experience_level_display', read_only=True)
    
    class Meta:
        model = CreatorProfile
        fields = '__all__'
        read_only_fields = ['id', 'user', 'followers_count', 'created_at']

class ClientProfileSerializer(serializers.ModelSerializer):
    user = UserWithProfileSerializer(read_only=True)
    client_type_display = serializers.CharField(source='get_client_type_display', read_only=True)
    completion_rate = serializers.ReadOnlyField()
    
    class Meta:
        model = ClientProfile
        fields = '__all__'
        read_only_fields = ['id', 'user', 'projects_posted', 'projects_completed', 'total_spent', 'created_at']

class ProjectCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectCategory
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    client = UserSerializer(read_only=True)
    category = ProjectCategorySerializer(read_only=True)
    selected_freelancer = UserSerializer(read_only=True)
    required_skills_list = serializers.ReadOnlyField(source='get_required_skills_list')
    applications_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ['id', 'client', 'selected_freelancer', 'created_at', 'updated_at']
    
    def get_applications_count(self, obj):
        return obj.applications.count()

class ProjectApplicationSerializer(serializers.ModelSerializer):
    freelancer = UserSerializer(read_only=True)
    project = ProjectSerializer(read_only=True)
    freelancer_profile = serializers.SerializerMethodField()
    
    class Meta:
        model = ProjectApplication
        fields = '__all__'
        read_only_fields = ['id', 'freelancer', 'applied_at']
    
    def get_freelancer_profile(self, obj):
        try:
            profile = obj.freelancer.freelancer_profile
            return FreelancerProfileSerializer(profile).data
        except FreelancerProfile.DoesNotExist:
            return None

class ProjectContractSerializer(serializers.ModelSerializer):
    freelancer = UserSerializer(read_only=True)
    client = UserSerializer(read_only=True)
    project = ProjectSerializer(read_only=True)
    
    class Meta:
        model = ProjectContract
        fields = '__all__'
        read_only_fields = ['id', 'freelancer', 'client', 'created_at']

class ProjectReviewSerializer(serializers.ModelSerializer):
    reviewer = UserSerializer(read_only=True)
    reviewee = UserSerializer(read_only=True)
    
    class Meta:
        model = ProjectReview
        fields = '__all__'
        read_only_fields = ['id', 'reviewer', 'reviewee', 'created_at']

# Social Media Serializers for Posts, Likes, and Comments
class PostSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    tags_list = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    can_comment = serializers.SerializerMethodField()
    time_since_posted = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'user', 'title', 'content', 'category', 'tags', 'tags_list',
            'is_public', 'allow_comments', 'allow_sharing', 'like_count', 
            'comment_count', 'share_count', 'view_count', 'image', 
            'created_at', 'updated_at', 'is_liked', 'can_comment', 'time_since_posted'
        ]
        read_only_fields = ['id', 'user', 'like_count', 'comment_count', 'share_count', 'view_count', 'created_at', 'updated_at']
    
    def get_tags_list(self, obj):
        return obj.get_tags_list()
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False
    
    def get_can_comment(self, obj):
        return obj.allow_comments
    
    def get_time_since_posted(self, obj):
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff < timedelta(minutes=1):
            return "Just now"
        elif diff < timedelta(hours=1):
            return f"{diff.seconds // 60}m ago"
        elif diff < timedelta(days=1):
            return f"{diff.seconds // 3600}h ago"
        elif diff < timedelta(days=7):
            return f"{diff.days}d ago"
        else:
            return obj.created_at.strftime("%b %d, %Y")

class LikeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Like
        fields = ['id', 'user', 'post', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    time_since_posted = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = [
            'id', 'user', 'post', 'content', 'parent', 'like_count',
            'created_at', 'updated_at', 'replies', 'is_liked', 'time_since_posted'
        ]
        read_only_fields = ['id', 'user', 'post', 'like_count', 'created_at', 'updated_at']
    
    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(obj.replies.all(), many=True, context=self.context).data
        return []
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.comment_likes.filter(user=request.user).exists()
        return False
    
    def get_time_since_posted(self, obj):
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff < timedelta(minutes=1):
            return "Just now"
        elif diff < timedelta(hours=1):
            return f"{diff.seconds // 60}m ago"
        elif diff < timedelta(days=1):
            return f"{diff.seconds // 3600}h ago"
        elif diff < timedelta(days=7):
            return f"{diff.days}d ago"
        else:
            return obj.created_at.strftime("%b %d, %Y")

class CommentLikeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = CommentLike
        fields = ['id', 'user', 'comment', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

# Blog engagement serializers
class BlogLikeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = BlogLike
        fields = ['id', 'user', 'blog_post', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

class BlogCommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    time_since_posted = serializers.SerializerMethodField()
    
    class Meta:
        model = BlogComment
        fields = [
            'id', 'user', 'blog_post', 'content', 'parent', 'like_count',
            'created_at', 'updated_at', 'replies', 'is_liked', 'time_since_posted'
        ]
        read_only_fields = ['id', 'user', 'blog_post', 'like_count', 'created_at', 'updated_at']
    
    def get_replies(self, obj):
        if obj.replies.exists():
            return BlogCommentSerializer(obj.replies.all(), many=True, context=self.context).data
        return []
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.comment_likes.filter(user=request.user).exists()
        return False
    
    def get_time_since_posted(self, obj):
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff < timedelta(minutes=1):
            return "Just now"
        elif diff < timedelta(hours=1):
            return f"{diff.seconds // 60}m ago"
        elif diff < timedelta(days=1):
            return f"{diff.seconds // 3600}h ago"
        elif diff < timedelta(days=7):
            return f"{diff.days}d ago"
        else:
            return obj.created_at.strftime("%b %d, %Y")