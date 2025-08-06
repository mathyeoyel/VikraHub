# backend/messaging/views.py
import logging
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.views import APIView
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

# Set up logging
logger = logging.getLogger(__name__)


class MessagePagination(PageNumberPagination):
    """Custom pagination for messages"""
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100


class ConversationListAPIView(APIView):
    """
    🚀 Fixed API endpoint for listing conversations
    Handles authentication, error cases, and proper data serialization
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get conversations for authenticated user with proper error handling"""
        try:
            user = request.user
            logger.info(f"Fetching conversations for user: {user.username}")
            
            # Get conversations where user is a participant
            conversations = Conversation.objects.filter(
                participants=user,
                is_deleted=False
            ).exclude(
                deleted_by=user
            ).prefetch_related(
                'participants',
                Prefetch('messages', queryset=Message.objects.filter(is_deleted=False).order_by('-created_at'))
            ).annotate(
                latest_message_time=Max('messages__created_at')
            ).order_by('-latest_message_time', '-updated_at')
            
            # Serialize conversations with context
            serializer = ConversationSerializer(
                conversations, 
                many=True, 
                context={'request': request}
            )
            
            logger.info(f"Successfully fetched {len(conversations)} conversations for {user.username}")
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error fetching conversations for user {request.user.username}: {str(e)}")
            return Response(
                {"error": "Failed to fetch conversations", "detail": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


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
        """Get conversations for current user with enhanced error handling"""
        try:
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
        except Exception as e:
            logger.error(f"Error in get_queryset for user {self.request.user.username}: {str(e)}")
            return Conversation.objects.none()
    
    def list(self, request, *args, **kwargs):
        """Enhanced list method with error handling"""
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error listing conversations: {str(e)}")
            return Response(
                {"error": "Failed to retrieve conversations", "detail": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def perform_create(self, serializer):
        """Create conversation with current user as participant"""
        try:
            conversation = serializer.save()
            return conversation
        except Exception as e:
            logger.error(f"Error creating conversation: {str(e)}")
            raise


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
    
    def create(self, request, *args, **kwargs):
        """Enhanced create method with better error handling"""
        try:
            conversation_id = self.kwargs.get('conversation_id')
            logger.info(f"Creating message for conversation {conversation_id} by user {request.user.username}")
            logger.info(f"Request data: {request.data}")
            
            # Validate conversation exists and user is participant
            try:
                conversation = Conversation.objects.get(
                    id=conversation_id,
                    participants=request.user,
                    is_deleted=False
                )
            except Conversation.DoesNotExist:
                logger.error(f"Conversation {conversation_id} not found or user {request.user.username} is not a participant")
                return Response(
                    {'error': 'Conversation not found or you are not a participant'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Validate content
            content = request.data.get('content', '').strip()
            if not content:
                logger.error("Empty message content provided")
                return Response(
                    {'error': 'Message content cannot be empty'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Add conversation to request data
            mutable_data = request.data.copy()
            mutable_data['conversation'] = conversation.id
            
            # Create serializer with conversation included
            serializer = self.get_serializer(data=mutable_data)
            if not serializer.is_valid():
                logger.error(f"Serializer validation failed: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            # Save the message
            message = serializer.save()
            logger.info(f"Message created successfully: {message.id}")
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Unexpected error creating message: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': 'Internal server error occurred while creating message'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
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
                
                # Send unread count update
                send_unread_count_update(participant)
        
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
    
    # Send unread count update via WebSocket
    send_unread_count_update(request.user)
    
    return Response({'status': 'success'})


def send_unread_count_update(user):
    """Send real-time unread count update to user"""
    try:
        # Calculate current unread counts
        message_count = Message.objects.filter(
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
        
        # For notifications, import here to avoid circular imports
        from core.models import Notification
        notification_count = Notification.objects.filter(
            user=user,
            is_read=False
        ).count()
        
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{user.id}",
            {
                'type': 'unread_count_update',
                'message_count': message_count,
                'notification_count': notification_count,
                'timestamp': timezone.now().isoformat()
            }
        )
    except Exception as e:
        logger.warning(f"Failed to send unread count update: {e}")


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


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_messages_between_users(request):
    """Get all messages between current user and another user - /api/messages/?user_id=X"""
    try:
        user_id = request.GET.get('user_id')
        if not user_id:
            return Response(
                {'error': 'user_id parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the other user
        try:
            other_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get conversation between these users
        conversation = Conversation.objects.filter(
            participants=request.user,
            is_deleted=False
        ).filter(
            participants=other_user
        ).first()
        
        if not conversation:
            return Response([])  # Return empty array instead of object
        
        # Get messages in this conversation
        messages = Message.objects.filter(
            conversation=conversation,
            is_deleted=False
        ).exclude(
            deleted_by=request.user
        ).select_related('sender', 'recipient').order_by('created_at')
        
        serializer = MessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data)  # Return array directly
        
    except Exception as e:
        logger.exception(f"Error getting messages with user: {e}")
        return Response(
            {'error': 'Failed to get messages'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated]) 
def get_unread_messages_count(request, user_id):
    """Get unread message count with specific user"""
    try:
        # Get the other user
        try:
            other_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Count unread messages from this user
        unread_count = Message.objects.filter(
            sender=other_user,
            recipient=request.user,
            is_deleted=False
        ).exclude(
            read_by=request.user
        ).count()
        
        return Response({'unread_count': unread_count})
        
    except Exception as e:
        logger.exception(f"Error getting unread count with user: {e}")
        return Response(
            {'error': 'Failed to get unread count'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Reaction endpoints
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_message_reaction(request, message_id):
    """Add a reaction to a message"""
    try:
        message = get_object_or_404(Message, id=message_id, is_deleted=False)
        reaction_type = request.data.get('reaction_type')
        
        if not reaction_type:
            return Response(
                {'error': 'reaction_type is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user is participant in the conversation
        if not message.conversation.participants.filter(id=request.user.id).exists():
            return Response(
                {'error': 'You are not a participant in this conversation'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Import here to avoid circular imports
        from .models import MessageReaction
        
        # Create or update reaction
        reaction, created = MessageReaction.objects.update_or_create(
            message=message,
            user=request.user,
            defaults={'reaction': reaction_type}
        )
        
        # Send WebSocket update to conversation participants
        channel_layer = get_channel_layer()
        conversation_group_name = f"conversation_{message.conversation.id}"
        
        # Get all reactions for this message to send complete data
        from .models import MessageReaction
        reactions = list(MessageReaction.objects.filter(message=message).values(
            'id', 'user__id', 'user__username', 'reaction', 'reacted_at'
        ))
        
        async_to_sync(channel_layer.group_send)(
            conversation_group_name,
            {
                'type': 'reaction_update',
                'message_id': str(message.id),
                'reactions': reactions,
                'user': {
                    'id': request.user.id,
                    'username': request.user.username
                },
                'reaction': reaction_type,
                'added': True
            }
        )
        
        logger.info(f"Reaction {reaction_type} {'updated' if not created else 'added'} to message {message_id} by {request.user.username}")
        
        return Response({
            'status': 'success',
            'message': f'Reaction {"updated" if not created else "added"} successfully',
            'reaction': {
                'id': reaction.id,
                'reaction_type': reaction.reaction,
                'user': {
                    'id': request.user.id,
                    'username': request.user.username
                },
                'created_at': reaction.reacted_at.isoformat()
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.exception(f"Error adding reaction to message {message_id}: {e}")
        return Response(
            {'error': 'Failed to add reaction'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def remove_message_reaction(request, message_id):
    """Remove user's reaction from a message"""
    try:
        message = get_object_or_404(Message, id=message_id, is_deleted=False)
        
        # Check if user is participant in the conversation
        if not message.conversation.participants.filter(id=request.user.id).exists():
            return Response(
                {'error': 'You are not a participant in this conversation'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Import here to avoid circular imports
        from .models import MessageReaction
        
        # Find and delete user's reaction
        try:
            reaction = MessageReaction.objects.get(
                message=message,
                user=request.user
            )
            reaction_type = reaction.reaction
            reaction.delete()
            
            # Send WebSocket update to conversation participants
            channel_layer = get_channel_layer()
            conversation_group_name = f"conversation_{message.conversation.id}"
            
            # Get remaining reactions for this message
            from .models import MessageReaction
            reactions = list(MessageReaction.objects.filter(message=message).values(
                'id', 'user__id', 'user__username', 'reaction', 'reacted_at'
            ))
            
            async_to_sync(channel_layer.group_send)(
                conversation_group_name,
                {
                    'type': 'reaction_update',
                    'message_id': str(message.id),
                    'reactions': reactions,
                    'user': {
                        'id': request.user.id,
                        'username': request.user.username
                    },
                    'reaction': reaction_type,
                    'added': False
                }
            )
            
            logger.info(f"Reaction removed from message {message_id} by {request.user.username}")
            
            return Response({
                'status': 'success',
                'message': 'Reaction removed successfully'
            }, status=status.HTTP_200_OK)
            
        except MessageReaction.DoesNotExist:
            return Response(
                {'error': 'No reaction found to remove'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
    except Exception as e:
        logger.exception(f"Error removing reaction from message {message_id}: {e}")
        return Response(
            {'error': 'Failed to remove reaction'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
