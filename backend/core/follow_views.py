# backend/core/follow_views.py
import logging
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.db.models import Q, Prefetch
from django.db import models
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .follow_models import Follow, FollowNotification
from .follow_serializers import (
    FollowSerializer,
    FollowCreateSerializer,
    FollowStatsSerializer,
    FollowNotificationSerializer,
    FollowListSerializer,
    UserProfileFollowSerializer,
    UserBasicSerializer
)

# Set up logging
logger = logging.getLogger(__name__)


class FollowPagination(PageNumberPagination):
    """Custom pagination for follow lists"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class FollowToggleView(generics.GenericAPIView):
    """Idempotent follow/unfollow endpoint with consistent responses"""
    permission_classes = [permissions.IsAuthenticated]
    
    def put(self, request, user_id):
        """Idempotent follow operation - always returns current follow state"""
        return self._handle_follow_operation(request, user_id, follow=True)
    
    def delete(self, request, user_id):
        """Idempotent unfollow operation - always returns current follow state"""
        return self._handle_follow_operation(request, user_id, follow=False)
    
    def post(self, request, *args, **kwargs):
        """Legacy POST endpoint for backward compatibility"""
        data = request.data
        user_id = data.get('user_id')
        
        if not user_id:
            return Response({
                "error": "user_id is required"
            }, status=status.HTTP_400_BAD_REQUEST)
            
        return self._handle_follow_operation(request, user_id, follow=True)
    
    def _handle_follow_operation(self, request, user_id, follow=True):
        """Unified idempotent follow/unfollow logic"""
        try:
            # Resolve target user
            try:
                target_user = get_object_or_404(User, id=user_id)
            except Exception as e:
                logger.warning(f"User lookup failed: {e}")
                return Response({
                    "error": "User not found"
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Validate user cannot follow themselves
            if target_user == request.user:
                return Response({
                    "error": "You cannot follow yourself"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get or create follow relationship
            follow_rel, created = Follow.objects.get_or_create(
                follower=request.user, 
                followed=target_user,
                defaults={'is_active': follow}
            )
            
            # Track if state actually changed
            state_changed = False
            previous_state = follow_rel.is_active
            
            if follow_rel.is_active != follow:
                follow_rel.is_active = follow
                follow_rel.save()
                state_changed = True
            
            # Handle notifications only if state changed to following
            if follow and state_changed:
                try:
                    notification, _ = FollowNotification.objects.get_or_create(
                        follow=follow_rel,
                        recipient=target_user
                    )
                    self.send_follow_notification(follow_rel)
                except Exception as notification_error:
                    logger.warning(f"Failed to create notification: {notification_error}")
            
            # Get current follow stats for target user
            followers_count = Follow.objects.filter(
                followed=target_user, 
                is_active=True
            ).count()
            
            following_count = Follow.objects.filter(
                follower=target_user,
                is_active=True  
            ).count()
            
            # Return consistent response format regardless of previous state
            return Response({
                "status": "success",
                "is_following": follow_rel.is_active,
                "state_changed": state_changed,
                "previous_state": previous_state,
                "message": f"{'Now following' if follow_rel.is_active else 'Unfollowed'} {target_user.username}",
                "target_user": {
                    "id": target_user.id,
                    "username": target_user.username,
                    "followers_count": followers_count,
                    "following_count": following_count
                },
                "follow_data": FollowSerializer(follow_rel).data if follow_rel.is_active else None
            }, status=status.HTTP_200_OK)
                
        except Exception as exc:
            logger.exception(f'Error in follow operation: {exc}')
            return Response({
                "error": "An unexpected error occurred"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def send_follow_notification(self, follow_obj):
        """Send real-time follow notification via WebSocket"""
        try:
            channel_layer = get_channel_layer()
            
            # Send notification to the followed user
            async_to_sync(channel_layer.group_send)(
                f"user_{follow_obj.followed.id}",
                {
                    'type': 'follow_notification',
                    'follower': {
                        'id': follow_obj.follower.id,
                        'username': follow_obj.follower.username,
                        'full_name': f"{follow_obj.follower.first_name} {follow_obj.follower.last_name}".strip() or follow_obj.follower.username,
                        'profile_picture': self.get_user_profile_picture(follow_obj.follower)
                    },
                    'message': f'{follow_obj.follower.username} started following you',
                    'timestamp': follow_obj.created_at.isoformat(),
                    'follow_id': str(follow_obj.id)
                }
            )
        except Exception as e:
            logger.warning(f"Failed to send WebSocket notification: {e}")
    
    def get_user_profile_picture(self, user):
        """Get user profile picture URL"""
        try:
            if hasattr(user, 'profile') and user.profile.profile_picture:
                return user.profile.profile_picture
        except Exception as e:
            logger.debug(f"Error getting profile picture: {e}")
        return None


# Legacy endpoints for backward compatibility
class FollowCreateView(FollowToggleView):
    """Legacy follow endpoint - redirects to new idempotent endpoint"""
    pass


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def unfollow_user(request, user_id):
    """Legacy unfollow endpoint - redirects to new idempotent endpoint"""
    # Use the new idempotent view
    view = FollowToggleView()
    return view.delete(request, user_id)


class UserFollowersListView(generics.ListAPIView):
    """Get list of user's followers"""
    serializer_class = FollowListSerializer
    pagination_class = FollowPagination
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get followers for specified user"""
        user_id = self.kwargs.get('user_id')
        user = get_object_or_404(User, id=user_id)
        
        return Follow.objects.filter(
            followed=user,
            is_active=True
        ).select_related('follower').order_by('-created_at')
    
    def get_serializer_context(self):
        """Add list type to context"""
        context = super().get_serializer_context()
        context['list_type'] = 'followers'
        return context


class UserFollowingListView(generics.ListAPIView):
    """Get list of users that a user is following"""
    serializer_class = FollowListSerializer
    pagination_class = FollowPagination
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get following list for specified user"""
        user_id = self.kwargs.get('user_id')
        user = get_object_or_404(User, id=user_id)
        
        return Follow.objects.filter(
            follower=user,
            is_active=True
        ).select_related('followed').order_by('-created_at')
    
    def get_serializer_context(self):
        """Add list type to context"""
        context = super().get_serializer_context()
        context['list_type'] = 'following'
        return context


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_follow_stats_query(request):
    """Get follow statistics for a user using query parameter"""
    user_id = request.GET.get('user_id')
    if not user_id:
        return Response({
            'error': 'user_id query parameter is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = get_object_or_404(User, id=int(user_id))
        serializer = FollowStatsSerializer(user, context={'request': request})
        return Response(serializer.data)
    except ValueError:
        return Response({
            'error': 'Invalid user_id format'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_follow_stats(request, user_id):
    """Get follow statistics for a user (public access)"""
    user = get_object_or_404(User, id=user_id)
    serializer = FollowStatsSerializer(user, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_my_follow_stats(request):
    """Get follow statistics for current user"""
    serializer = FollowStatsSerializer(request.user, context={'request': request})
    return Response(serializer.data)


class FollowNotificationListView(generics.ListAPIView):
    """Get list of follow notifications for current user"""
    serializer_class = FollowNotificationSerializer
    pagination_class = FollowPagination
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get notifications for current user"""
        return FollowNotification.objects.filter(
            recipient=self.request.user
        ).select_related('follow__follower').order_by('-created_at')


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_follow_notification_read(request, notification_id):
    """Mark a follow notification as read"""
    try:
        notification = get_object_or_404(
            FollowNotification,
            id=notification_id,
            recipient=request.user
        )
        
        notification.mark_as_read()
        
        return Response({
            'status': 'success',
            'message': 'Notification marked as read'
        })
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_all_follow_notifications_read(request):
    """Mark all follow notifications as read for current user"""
    try:
        notifications = FollowNotification.objects.filter(
            recipient=request.user,
            is_read=False
        )
        
        count = notifications.count()
        for notification in notifications:
            notification.mark_as_read()
        
        return Response({
            'status': 'success',
            'message': f'Marked {count} notifications as read'
        })
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_follow_suggestions(request):
    """Get follow suggestions for current user"""
    current_user = request.user
    
    # Get users that current user is not following
    # Exclude self and already followed users
    following_ids = current_user.following_set.filter(
        is_active=True
    ).values_list('followed_id', flat=True)
    
    exclude_ids = list(following_ids) + [current_user.id]
    
    # Get popular users (with most followers) that user is not following
    suggested_users = User.objects.exclude(
        id__in=exclude_ids
    ).annotate(
        followers_count=models.Count('followers_set', filter=models.Q(followers_set__is_active=True))
    ).filter(
        followers_count__gt=0
    ).order_by('-followers_count')[:10]
    
    serializer = UserBasicSerializer(suggested_users, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def search_users_to_follow(request):
    """Search for users to follow"""
    query = request.GET.get('q', '').strip()
    
    if not query or len(query) < 2:
        return Response({
            'error': 'Search query must be at least 2 characters long'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    current_user = request.user
    
    # Search users by username, first name, or last name
    users = User.objects.filter(
        Q(username__icontains=query) |
        Q(first_name__icontains=query) |
        Q(last_name__icontains=query)
    ).exclude(id=current_user.id)[:20]
    
    serializer = UserBasicSerializer(users, many=True, context={'request': request})
    return Response(serializer.data)
