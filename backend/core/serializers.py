from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    TeamMember, Service, PortfolioItem, BlogPost, UserProfile, Notification,
    AssetCategory, CreativeAsset, AssetPurchase, AssetReview,
    FreelancerProfile, CreatorProfile, ClientProfile, ProjectCategory, Project, 
    ProjectApplication, ProjectContract, ProjectReview
)
from .cloudinary_utils import get_optimized_avatar_url, validate_cloudinary_url
from .asset_utils import validate_asset_price, validate_asset_tags

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    user_type = serializers.CharField(write_only=True, required=False, default='client')
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password', 'user_type', 'date_joined', 'is_staff', 'is_superuser', 'is_active']
        read_only_fields = ['id', 'date_joined', 'is_staff', 'is_superuser']
        extra_kwargs = {
            'password': {'write_only': True},
        }
    
    def create(self, validated_data):
        user_type = validated_data.pop('user_type', 'client')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        
        # Update the user's profile with the user_type (profile created by signal)
        profile = user.userprofile
        profile.user_type = user_type
        profile.save()
        
        return user

class PublicUserSerializer(serializers.ModelSerializer):
    """Serializer for public user information (no sensitive data)"""
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'date_joined']
        read_only_fields = ['id', 'username', 'first_name', 'last_name', 'date_joined']

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=False, required=False)
    last_name = serializers.CharField(source='user.last_name', read_only=False, required=False)
    email = serializers.EmailField(source='user.email', read_only=False, required=False)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'user_type', 'avatar', 'cover_photo', 'bio', 'location', 
                 'website', 'twitter', 'instagram', 'facebook', 'linkedin', 'github', 
                 'skills', 'headline', 'achievements', 'services_offered', 
                 'first_name', 'last_name', 'email']
        read_only_fields = ['id', 'user']
    
    def to_representation(self, instance):
        """Override to include user fields in the response and optimize avatar"""
        data = super().to_representation(instance)
        if instance.user:
            data['first_name'] = instance.user.first_name
            data['last_name'] = instance.user.last_name
            data['email'] = instance.user.email
        
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
        
        # Handle direct user fields
        for field in user_fields:
            if field in validated_data:
                user_data[field] = validated_data.pop(field)
        
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
        
        # Update profile fields
        for field_name, value in validated_data.items():
            setattr(instance, field_name, value)
        instance.save()
        
        return instance

class PortfolioItemSerializer(serializers.ModelSerializer):
    tags_list = serializers.SerializerMethodField()
    
    class Meta:
        model = PortfolioItem
        fields = ['id', 'title', 'description', 'image', 'url', 'tags', 'tags_list', 'date']
        read_only_fields = ['id', 'date']
    
    def get_tags_list(self, obj):
        return obj.get_tags_list()

class PublicUserProfileSerializer(serializers.ModelSerializer):
    """Serializer for public user profiles (only public information)"""
    user = PublicUserSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    member_since = serializers.DateTimeField(source='user.date_joined', read_only=True)
    portfolio_items = serializers.SerializerMethodField()
    client_profile = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'user_type', 'avatar', 'cover_photo', 'bio', 'website', 'headline',
                 'skills', 'location', 'achievements', 'services_offered', 'full_name', 'member_since', 'portfolio_items',
                 'facebook', 'instagram', 'twitter', 'linkedin', 'github', 'client_profile']
        read_only_fields = ['id', 'user', 'user_type', 'avatar', 'cover_photo', 'bio', 'website', 'headline',
                           'skills', 'location', 'achievements', 'services_offered', 'full_name', 'member_since', 'portfolio_items',
                           'facebook', 'instagram', 'twitter', 'linkedin', 'github', 'client_profile']
    
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
    
    class Meta:
        model = BlogPost
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'author', 'slug']

class NotificationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'user']


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