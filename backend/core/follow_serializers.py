# backend/core/follow_serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError as DjangoValidationError
from .follow_models import Follow, FollowNotification


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user serializer for follow-related endpoints"""
    full_name = serializers.SerializerMethodField()
    profile_picture = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'profile_picture']
        read_only_fields = ['id', 'email']
    
    def get_full_name(self, obj):
        """Get user's full name or fallback to username"""
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        return full_name if full_name else obj.username
    
    def get_profile_picture(self, obj):
        """Get user's profile picture URL"""
        try:
            if hasattr(obj, 'profile') and obj.profile.profile_picture:
                return obj.profile.profile_picture
        except:
            pass
        return None


class FollowSerializer(serializers.ModelSerializer):
    """Serializer for Follow model"""
    follower = UserBasicSerializer(read_only=True)
    followed = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = Follow
        fields = ['id', 'follower', 'followed', 'created_at', 'is_active']
        read_only_fields = ['id', 'created_at']


class FollowCreateSerializer(serializers.Serializer):
    """Serializer for creating follow relationships"""
    user_id = serializers.IntegerField()
    
    def validate_user_id(self, value):
        """Validate that the user exists and is not the current user"""
        try:
            user = User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found.")
        
        current_user = self.context['request'].user
        if user == current_user:
            raise serializers.ValidationError("You cannot follow yourself.")
        
        return value
    
    def create(self, validated_data):
        """Create a follow relationship"""
        current_user = self.context['request'].user
        followed_user = User.objects.get(id=validated_data['user_id'])
        
        try:
            follow_obj, created = current_user.follow(followed_user)
            return follow_obj
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))


class FollowStatsSerializer(serializers.Serializer):
    """Serializer for follow statistics"""
    followers_count = serializers.IntegerField()
    following_count = serializers.IntegerField()
    is_following = serializers.BooleanField()
    is_followed_by = serializers.BooleanField()
    
    def to_representation(self, instance):
        """Convert User instance to follow stats"""
        current_user = self.context.get('request').user if self.context.get('request') else None
        
        data = {
            'followers_count': instance.get_followers_count(),
            'following_count': instance.get_following_count(),
            'is_following': False,
            'is_followed_by': False
        }
        
        if current_user and current_user.is_authenticated and current_user != instance:
            data['is_following'] = current_user.is_following(instance)
            data['is_followed_by'] = current_user.is_followed_by(instance)
        
        return data


class FollowNotificationSerializer(serializers.ModelSerializer):
    """Serializer for follow notifications"""
    follower = UserBasicSerializer(source='follow.follower', read_only=True)
    follow_date = serializers.DateTimeField(source='follow.created_at', read_only=True)
    
    class Meta:
        model = FollowNotification
        fields = ['id', 'follower', 'follow_date', 'is_read', 'read_at', 'created_at']
        read_only_fields = ['id', 'created_at', 'read_at']


class FollowListSerializer(serializers.ModelSerializer):
    """Serializer for listing followers/following"""
    user = UserBasicSerializer(read_only=True)
    mutual_follow = serializers.SerializerMethodField()
    follow_date = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = Follow
        fields = ['id', 'user', 'follow_date', 'mutual_follow']
        read_only_fields = ['id', 'follow_date']
    
    def get_mutual_follow(self, obj):
        """Check if there's a mutual follow relationship"""
        current_user = self.context.get('request').user if self.context.get('request') else None
        if not current_user or not current_user.is_authenticated:
            return False
        
        # For followers list: check if current user follows this follower
        if hasattr(self, '_is_followers_list') and self._is_followers_list:
            return current_user.is_following(obj.follower)
        
        # For following list: check if this followed user follows current user back
        return obj.followed.is_following(current_user)
    
    def to_representation(self, instance):
        """Override to set the correct user field based on context"""
        data = super().to_representation(instance)
        
        # Determine if this is followers or following list
        is_followers_list = self.context.get('list_type') == 'followers'
        self._is_followers_list = is_followers_list
        
        if is_followers_list:
            data['user'] = UserBasicSerializer(instance.follower).data
        else:
            data['user'] = UserBasicSerializer(instance.followed).data
        
        return data


class UserProfileFollowSerializer(serializers.ModelSerializer):
    """Extended user serializer with follow information"""
    full_name = serializers.SerializerMethodField()
    profile_picture = serializers.SerializerMethodField()
    follow_stats = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'full_name', 
                 'profile_picture', 'follow_stats', 'date_joined']
        read_only_fields = ['id', 'date_joined']
    
    def get_full_name(self, obj):
        """Get user's full name or fallback to username"""
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        return full_name if full_name else obj.username
    
    def get_profile_picture(self, obj):
        """Get user's profile picture URL"""
        try:
            if hasattr(obj, 'profile') and obj.profile.profile_picture:
                return obj.profile.profile_picture
        except:
            pass
        return None
    
    def get_follow_stats(self, obj):
        """Get follow statistics for this user"""
        return FollowStatsSerializer(obj, context=self.context).data
