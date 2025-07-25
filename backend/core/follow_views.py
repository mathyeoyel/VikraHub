# backend/core/follow_views.py
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


class FollowPagination(PageNumberPagination):
    """Custom pagination for follow lists"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class FollowCreateView(generics.CreateAPIView):
    """Follow a user"""
    serializer_class = FollowCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        """Create follow relationship and send real-time notification"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        follow_obj = serializer.save()
        
        # Create notification for the followed user
        notification, created = FollowNotification.objects.get_or_create(
            follow=follow_obj,
            recipient=follow_obj.followed
        )
        
        # Send real-time notification via WebSocket
        self.send_follow_notification(follow_obj)
        
        return Response({
            'status': 'success',
            'message': f'You are now following {follow_obj.followed.username}',
            'follow': FollowSerializer(follow_obj).data
        }, status=status.HTTP_201_CREATED)
    
    def send_follow_notification(self, follow_obj):
        """Send real-time follow notification via WebSocket"""
        channel_layer = get_channel_layer()
        
        # Send notification to the followed user
        async_to_sync(channel_layer.group_send)(
            f"user_{follow_obj.followed.id}",
            {
                'type': 'follow_notification',
                'notification': {
                    'type': 'new_follower',
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
            }
        )
    
    def get_user_profile_picture(self, user):
        """Get user profile picture URL"""
        try:
            if hasattr(user, 'profile') and user.profile.profile_picture:
                return user.profile.profile_picture
        except:
            pass
        return None


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def unfollow_user(request, user_id):
    """Unfollow a user"""
    try:
        followed_user = get_object_or_404(User, id=user_id)
        
        if followed_user == request.user:
            return Response(
                {'error': 'You cannot unfollow yourself.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        success = request.user.unfollow(followed_user)
        
        if success:
            # Send real-time notification about unfollow
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"user_{followed_user.id}",
                {
                    'type': 'follow_notification',
                    'notification': {
                        'type': 'unfollowed',
                        'follower': {
                            'id': request.user.id,
                            'username': request.user.username,
                        },
                        'message': f'{request.user.username} unfollowed you',
                        'timestamp': timezone.now().isoformat()
                    }
                }
            )
            
            return Response({
                'status': 'success',
                'message': f'You unfollowed {followed_user.username}'
            })
        else:
            return Response(
                {'error': 'You are not following this user.'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


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
def get_follow_stats(request, user_id):
    """Get follow statistics for a user"""
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
