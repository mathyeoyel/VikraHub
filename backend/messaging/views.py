# backend/messaging/views.py
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.db.models import Q, Max, Count, Prefetch
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import Conversation, Message, ConversationParticipant
from .serializers import (
    ConversationSerializer,
    ConversationDetailSerializer,
    ConversationCreateSerializer,
    MessageSerializer,
    MessageCreateSerializer
)


class MessagePagination(PageNumberPagination):
    """Custom pagination for messages"""
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100


class ConversationListCreateView(generics.ListCreateAPIView):
    """
    List all conversations for the current user or create a new one
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ConversationCreateSerializer
        return ConversationSerializer
    
    def get_queryset(self):
        """Get conversations for current user"""
        user = self.request.user
        return Conversation.objects.filter(
            participants=user,
            is_deleted=False
        ).exclude(
            deleted_by=user
        ).prefetch_related(
            'participants',
            'messages'
        ).annotate(
            latest_message_time=Max('messages__created_at')
        ).order_by('-latest_message_time', '-updated_at')
    
    def perform_create(self, serializer):
        """Create conversation with current user as participant"""
        conversation = serializer.save()
        return conversation


class ConversationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a conversation
    """
    serializer_class = ConversationDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get conversations for current user"""
        user = self.request.user
        return Conversation.objects.filter(
            participants=user,
            is_deleted=False
        ).exclude(deleted_by=user)
    
    def retrieve(self, request, *args, **kwargs):
        """Retrieve conversation and mark messages as read"""
        conversation = self.get_object()
        
        # Mark all messages in this conversation as read by current user
        unread_messages = conversation.messages.filter(
            is_deleted=False
        ).exclude(sender=request.user).exclude(read_by=request.user)
        
        for message in unread_messages:
            message.mark_as_read(request.user)
        
        # Update last_read_at for current user
        participant_record = ConversationParticipant.objects.get(
            conversation=conversation,
            user=request.user
        )
        participant_record.last_read_at = timezone.now()
        participant_record.save()
        
        serializer = self.get_serializer(conversation)
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """Soft delete conversation for current user"""
        conversation = self.get_object()
        conversation.deleted_by.add(request.user)
        
        # If both participants have deleted, mark conversation as deleted
        if conversation.deleted_by.count() == conversation.participants.count():
            conversation.is_deleted = True
            conversation.save()
        
        return Response(status=status.HTTP_204_NO_CONTENT)


class MessageListCreateView(generics.ListCreateAPIView):
    """
    List messages for a conversation or create a new message
    """
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = MessagePagination
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MessageCreateSerializer
        return MessageSerializer
    
    def get_queryset(self):
        """Get messages for a specific conversation"""
        conversation_id = self.kwargs.get('conversation_id')
        conversation = get_object_or_404(
            Conversation,
            id=conversation_id,
            participants=self.request.user,
            is_deleted=False
        )
        
        # Only show messages not deleted by current user
        return Message.objects.filter(
            conversation=conversation,
            is_deleted=False
        ).exclude(
            deleted_by=self.request.user
        ).select_related('sender').prefetch_related('read_by').order_by('created_at')
    
    def perform_create(self, serializer):
        """Create message and send real-time notification"""
        message = serializer.save()
        conversation = message.conversation
        
        # Send real-time notification via WebSocket
        channel_layer = get_channel_layer()
        
        # Notify all participants except sender
        for participant in conversation.participants.all():
            if participant != message.sender:
                async_to_sync(channel_layer.group_send)(
                    f"user_{participant.id}",
                    {
                        'type': 'new_message',
                        'message': {
                            'id': str(message.id),
                            'conversation_id': str(conversation.id),
                            'sender': {
                                'id': message.sender.id,
                                'username': message.sender.username,
                                'full_name': f"{message.sender.first_name} {message.sender.last_name}".strip() or message.sender.username
                            },
                            'content': message.content,
                            'created_at': message.created_at.isoformat(),
                        }
                    }
                )
        
        return message


class MessageDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a specific message
    """
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get messages that user can access"""
        return Message.objects.filter(
            conversation__participants=self.request.user,
            is_deleted=False
        ).exclude(deleted_by=self.request.user)
    
    def update(self, request, *args, **kwargs):
        """Update message content and mark as edited"""
        message = self.get_object()
        
        # Only sender can edit their own messages
        if message.sender != request.user:
            return Response(
                {'error': 'You can only edit your own messages.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update content and mark as edited
        message.content = request.data.get('content', message.content)
        message.is_edited = True
        message.edited_at = timezone.now()
        message.save()
        
        serializer = self.get_serializer(message)
        
        # Send real-time update via WebSocket
        channel_layer = get_channel_layer()
        for participant in message.conversation.participants.all():
            async_to_sync(channel_layer.group_send)(
                f"user_{participant.id}",
                {
                    'type': 'message_updated',
                    'message': serializer.data
                }
            )
        
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """Soft delete message for current user"""
        message = self.get_object()
        message.deleted_by.add(request.user)
        
        # If message is deleted by sender, mark as globally deleted
        if message.sender == request.user:
            message.is_deleted = True
            message.deleted_at = timezone.now()
            message.save()
        
        # Send real-time notification
        channel_layer = get_channel_layer()
        for participant in message.conversation.participants.all():
            async_to_sync(channel_layer.group_send)(
                f"user_{participant.id}",
                {
                    'type': 'message_deleted',
                    'message_id': str(message.id),
                    'conversation_id': str(message.conversation.id)
                }
            )
        
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_conversation_as_read(request, conversation_id):
    """Mark all messages in a conversation as read"""
    conversation = get_object_or_404(
        Conversation,
        id=conversation_id,
        participants=request.user,
        is_deleted=False
    )
    
    # Mark all unread messages as read
    unread_messages = conversation.messages.filter(
        is_deleted=False
    ).exclude(sender=request.user).exclude(read_by=request.user)
    
    for message in unread_messages:
        message.mark_as_read(request.user)
    
    # Update last_read_at
    participant_record = ConversationParticipant.objects.get(
        conversation=conversation,
        user=request.user
    )
    participant_record.last_read_at = timezone.now()
    participant_record.save()
    
    return Response({'status': 'success'})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def start_typing(request, conversation_id):
    """Notify other participants that user is typing"""
    conversation = get_object_or_404(
        Conversation,
        id=conversation_id,
        participants=request.user,
        is_deleted=False
    )
    
    # Send typing notification via WebSocket
    channel_layer = get_channel_layer()
    
    for participant in conversation.participants.all():
        if participant != request.user:
            async_to_sync(channel_layer.group_send)(
                f"user_{participant.id}",
                {
                    'type': 'user_typing',
                    'conversation_id': str(conversation.id),
                    'user': {
                        'id': request.user.id,
                        'username': request.user.username,
                        'full_name': f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username
                    },
                    'is_typing': True
                }
            )
    
    return Response({'status': 'typing notification sent'})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def stop_typing(request, conversation_id):
    """Notify other participants that user stopped typing"""
    conversation = get_object_or_404(
        Conversation,
        id=conversation_id,
        participants=request.user,
        is_deleted=False
    )
    
    # Send stop typing notification via WebSocket
    channel_layer = get_channel_layer()
    
    for participant in conversation.participants.all():
        if participant != request.user:
            async_to_sync(channel_layer.group_send)(
                f"user_{participant.id}",
                {
                    'type': 'user_typing',
                    'conversation_id': str(conversation.id),
                    'user': {
                        'id': request.user.id,
                        'username': request.user.username,
                        'full_name': f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username
                    },
                    'is_typing': False
                }
            )
    
    return Response({'status': 'stop typing notification sent'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_unread_count(request):
    """Get total unread message count for current user"""
    user = request.user
    
    # Count unread messages across all conversations
    unread_count = Message.objects.filter(
        conversation__participants=user,
        conversation__is_deleted=False,
        is_deleted=False
    ).exclude(
        conversation__deleted_by=user
    ).exclude(
        sender=user
    ).exclude(
        read_by=user
    ).count()
    
    return Response({'unread_count': unread_count})
