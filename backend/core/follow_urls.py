# backend/core/follow_urls.py
from django.urls import path
from . import follow_views

app_name = 'follow'

urlpatterns = [
    # New idempotent follow/unfollow endpoints
    path('toggle/<int:user_id>/', follow_views.FollowToggleView.as_view(), name='follow-toggle'),
    
    # Legacy Follow/Unfollow actions (for backward compatibility)
    path('follow/', follow_views.FollowCreateView.as_view(), name='follow-user'),
    path('unfollow/<int:user_id>/', follow_views.unfollow_user, name='unfollow-user'),
    
    # Follow statistics
    path('stats/', follow_views.get_follow_stats_query, name='follow-stats-query'),
    path('stats/<int:user_id>/', follow_views.get_follow_stats, name='user-follow-stats'),
    path('my-stats/', follow_views.get_my_follow_stats, name='my-follow-stats'),
    
    # Followers and Following lists
    path('followers/<int:user_id>/', follow_views.UserFollowersListView.as_view(), name='user-followers'),
    path('following/<int:user_id>/', follow_views.UserFollowingListView.as_view(), name='user-following'),
    
    # Follow notifications
    path('notifications/', follow_views.FollowNotificationListView.as_view(), name='follow-notifications'),
    path('notifications/<uuid:notification_id>/read/', follow_views.mark_follow_notification_read, name='mark-notification-read'),
    path('notifications/read-all/', follow_views.mark_all_follow_notifications_read, name='mark-all-notifications-read'),
    
    # Follow suggestions and search
    path('suggestions/', follow_views.get_follow_suggestions, name='follow-suggestions'),
    path('search/', follow_views.search_users_to_follow, name='search-users'),
]
