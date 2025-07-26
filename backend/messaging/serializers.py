# backend/messaging/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from django.utils import timezone
from .models import Conversation, Message, ConversationParticipant, MessageRead


class UserSerializer(serializers.ModelSerializer):
    """Basic user serializer for messaging"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'full_name']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for messages"""
    sender = UserSerializer(read_only=True)
    recipient = UserSerializer(read_only=True)
    is_read = serializers.SerializerMethodField()
    read_by_users = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'sender', 'recipient', 'content', 'created_at', 
            'updated_at', 'is_edited', 'edited_at', 'is_deleted', 
            'is_read', 'read_by_users'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'sender', 'recipient']
    
    def get_is_read(self, obj):
        """Check if current user has read this message"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.is_read_by(request.user)
        return False
    
    def get_read_by_users(self, obj):
        """Get list of users who have read this message"""
        read_users = obj.read_by.all()
        return UserSerializer(read_users, many=True).data


class MessageCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating messages"""
    
    class Meta:
        model = Message
        fields = ['conversation', 'content']
    
    def validate_conversation(self, value):
        """Validate that user is participant in the conversation"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if not value.is_participant(request.user):
                raise serializers.ValidationError(
                    "You are not a participant in this conversation."
                )
        return value
    
    def create(self, validated_data):
        """Create message with sender set to current user"""
        request = self.context.get('request')
        validated_data['sender'] = request.user
        message = super().create(validated_data)
        
        # Update conversation's updated_at timestamp
        message.conversation.save()
        
        return message


class ConversationSerializer(serializers.ModelSerializer):
    """Serializer for conversations"""
    participants = UserSerializer(many=True, read_only=True)
    other_participant = serializers.SerializerMethodField()
    latest_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    last_activity = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'participants', 'other_participant', 'latest_message',
            'unread_count', 'last_activity', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_other_participant(self, obj):
        """Get the other participant in the conversation"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            other = obj.get_other_participant(request.user)
            if other:
                return UserSerializer(other).data
        return None
    
    def get_latest_message(self, obj):
        """Get the latest message in the conversation"""
        latest = obj.get_latest_message()
        if latest:
            return MessageSerializer(latest, context=self.context).data
        return None
    
    def get_unread_count(self, obj):
        """Get unread message count for current user"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.get_unread_count(request.user)
        return 0
    
    def get_last_activity(self, obj):
        """Get last activity timestamp"""
        latest_message = obj.get_latest_message()
        if latest_message:
            return latest_message.created_at
        return obj.updated_at


class ConversationCreateSerializer(serializers.Serializer):
    """Serializer for creating conversations"""
    participant_username = serializers.CharField()
    initial_message = serializers.CharField(required=False)
    
    def validate_participant_username(self, value):
        """Validate that the participant exists"""
        try:
            user = User.objects.get(username=value)
            request = self.context.get('request')
            if request and request.user == user:
                raise serializers.ValidationError(
                    "You cannot start a conversation with yourself."
                )
            return user
        except User.DoesNotExist:
            raise serializers.ValidationError(
                f"User with username '{value}' does not exist."
            )
    
    def create(self, validated_data):
        """Create conversation and optionally send initial message"""
        request = self.context.get('request')
        current_user = request.user
        other_user = validated_data['participant_username']
        initial_message = validated_data.get('initial_message')
        
        # Check if conversation already exists between these users
        existing_conversation = Conversation.objects.filter(
            participants=current_user,
            is_deleted=False
        ).filter(
            participants=other_user
        ).first()
        
        if existing_conversation:
            conversation = existing_conversation
        else:
            # Create new conversation
            conversation = Conversation.objects.create()
            conversation.participants.add(current_user, other_user)
        
        # Send initial message if provided
        if initial_message:
            Message.objects.create(
                conversation=conversation,
                sender=current_user,
                content=initial_message
            )
        
        return conversation


class ConversationDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for conversation with messages"""
    participants = UserSerializer(many=True, read_only=True)
    other_participant = serializers.SerializerMethodField()
    messages = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'participants', 'other_participant', 'messages',
            'unread_count', 'created_at', 'updated_at'
        ]
    
    def get_other_participant(self, obj):
        """Get the other participant in the conversation"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            other = obj.get_other_participant(request.user)
            if other:
                return UserSerializer(other).data
        return None
    
    def get_messages(self, obj):
        """Get messages for this conversation"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Only show messages not deleted by current user
            messages = obj.messages.filter(
                is_deleted=False
            ).exclude(
                deleted_by=request.user
            ).order_by('created_at')
            
            return MessageSerializer(
                messages, 
                many=True, 
                context=self.context
            ).data
        return []
    
    def get_unread_count(self, obj):
        """Get unread message count for current user"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.get_unread_count(request.user)
        return 0
