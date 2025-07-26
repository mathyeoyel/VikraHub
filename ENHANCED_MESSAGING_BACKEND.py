# 🚀 Enhanced Django Messaging Views Implementation

"""
This file contains the improved Django views for the messaging system
with proper error handling, authentication, and validation.

Place this code in your backend/messaging/views.py file.
"""

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
            
            # Validate user is authenticated
            if not user.is_authenticated:
                return Response(
                    {"error": "Authentication required"}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Get conversations where user is a participant
            conversations = Conversation.objects.filter(
                participants=user,
                is_deleted=False
            ).exclude(
                deleted_by=user
            ).prefetch_related(
                'participants',
                Prefetch(
                    'messages', 
                    queryset=Message.objects.filter(is_deleted=False).order_by('-created_at')
                )
            ).annotate(
                latest_message_time=Max('messages__created_at')
            ).order_by('-latest_message_time', '-updated_at')
            
            # Group conversations by other participants
            conversation_data = []
            for conv in conversations:
                try:
                    other_participant = conv.get_other_participant(user)
                    if other_participant:
                        latest_message = conv.get_latest_message()
                        
                        conversation_item = {
                            'id': str(conv.id),
                            'other_participant': {
                                'id': other_participant.id,
                                'username': other_participant.username,
                                'full_name': f"{other_participant.first_name} {other_participant.last_name}".strip() or other_participant.username,
                                'first_name': other_participant.first_name,
                                'last_name': other_participant.last_name,
                            },
                            'latest_message': {
                                'content': latest_message.content if latest_message else None,
                                'created_at': latest_message.created_at.isoformat() if latest_message else None,
                                'sender': {
                                    'username': latest_message.sender.username,
                                    'full_name': f"{latest_message.sender.first_name} {latest_message.sender.last_name}".strip() or latest_message.sender.username
                                } if latest_message else None
                            } if latest_message else None,
                            'unread_count': conv.get_unread_count(user),
                            'created_at': conv.created_at.isoformat(),
                            'updated_at': conv.updated_at.isoformat()
                        }
                        conversation_data.append(conversation_item)
                except Exception as conv_error:
                    logger.warning(f"Error processing conversation {conv.id}: {str(conv_error)}")
                    continue
            
            logger.info(f"Successfully fetched {len(conversation_data)} conversations for {user.username}")
            return Response(conversation_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error fetching conversations for user {request.user.username}: {str(e)}")
            return Response(
                {
                    "error": "Failed to fetch conversations", 
                    "detail": str(e),
                    "conversations": []  # Return empty list as fallback
                }, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# 🔧 API Health Check Endpoint
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def messaging_health_check(request):
    """Health check endpoint for messaging API"""
    try:
        user = request.user
        conversation_count = Conversation.objects.filter(participants=user).count()
        message_count = Message.objects.filter(
            Q(sender=user) | Q(recipient=user)
        ).count()
        
        return Response({
            "status": "healthy",
            "user": user.username,
            "conversation_count": conversation_count,
            "message_count": message_count,
            "timestamp": timezone.now().isoformat()
        })
    except Exception as e:
        return Response({
            "status": "error",
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 🚀 Enhanced Message Creation with Validation
class MessageCreateAPIView(APIView):
    """Enhanced message creation with proper validation"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, conversation_id):
        """Create a new message with enhanced validation"""
        try:
            user = request.user
            content = request.data.get('content', '').strip()
            
            # Validate input
            if not content:
                return Response(
                    {"error": "Message content cannot be empty"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if len(content) > 5000:  # Reasonable message limit
                return Response(
                    {"error": "Message too long (max 5000 characters)"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get conversation and validate user access
            try:
                conversation = Conversation.objects.get(
                    id=conversation_id,
                    participants=user,
                    is_deleted=False
                )
            except Conversation.DoesNotExist:
                return Response(
                    {"error": "Conversation not found or access denied"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get recipient (other participant)
            recipient = conversation.get_other_participant(user)
            if not recipient:
                return Response(
                    {"error": "Cannot determine message recipient"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create message
            message = Message.objects.create(
                conversation=conversation,
                sender=user,
                recipient=recipient,
                content=content
            )
            
            # Update conversation timestamp
            conversation.updated_at = timezone.now()
            conversation.save()
            
            # Serialize response
            message_data = {
                'id': str(message.id),
                'conversation': str(conversation.id),
                'sender': {
                    'username': user.username,
                    'full_name': f"{user.first_name} {user.last_name}".strip() or user.username
                },
                'content': message.content,
                'created_at': message.created_at.isoformat(),
                'is_read': False
            }
            
            logger.info(f"Message created successfully: {user.username} -> {recipient.username}")
            return Response(message_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creating message: {str(e)}")
            return Response(
                {"error": "Failed to create message", "detail": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


"""
🔧 Add these URL patterns to your backend/messaging/urls.py:

urlpatterns = [
    # Enhanced conversation endpoints
    path('conversations/', views.ConversationListAPIView.as_view(), name='conversation-list-api'),
    path('conversations/<uuid:conversation_id>/messages/', views.MessageCreateAPIView.as_view(), name='message-create-api'),
    path('health/', views.messaging_health_check, name='messaging-health'),
    
    # ... your existing URLs
]

🚀 Benefits of this implementation:
✅ Proper authentication validation
✅ Comprehensive error handling with logging
✅ Input validation and sanitization
✅ Graceful fallbacks for failed operations
✅ Detailed error messages for debugging
✅ Health check endpoint for monitoring
✅ User-friendly error responses
✅ Proper HTTP status codes
✅ Performance optimizations with prefetch_related
"""
