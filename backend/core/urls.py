from django.urls import path, include
from rest_framework import routers
from .api_views import (
    UserViewSet, UserProfileViewSet, PublicUserProfileViewSet,
    TeamMemberViewSet, ServiceViewSet, PortfolioItemViewSet, 
    BlogPostViewSet, NotificationViewSet, AssetCategoryViewSet, 
    CreativeAssetViewSet, AssetPurchaseViewSet, AssetReviewViewSet, 
    FreelancerProfileViewSet, CreatorProfileViewSet, ClientProfileViewSet,
    ProjectCategoryViewSet, ProjectViewSet, ProjectApplicationViewSet, 
    ProjectContractViewSet, ProjectReviewViewSet, unread_notifications_count,
    PostViewSet, CommentViewSet, blog_like, blog_comments, blog_comment_like
)
from .google_auth import google_auth, google_auth_config

# API Router for DRF ViewSets
router = routers.DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'profiles', UserProfileViewSet)
router.register(r'public-profiles', PublicUserProfileViewSet, basename='publicuserprofile')
router.register(r'team', TeamMemberViewSet)
router.register(r'services', ServiceViewSet)
router.register(r'portfolio', PortfolioItemViewSet)
router.register(r'blog', BlogPostViewSet, basename='blogpost')
router.register(r'notifications', NotificationViewSet)

# Creative Assets Marketplace
router.register(r'asset-categories', AssetCategoryViewSet)
router.register(r'creative-assets', CreativeAssetViewSet)
router.register(r'asset-purchases', AssetPurchaseViewSet)
router.register(r'asset-reviews', AssetReviewViewSet)

# Freelancer Booking System
router.register(r'freelancer-profiles', FreelancerProfileViewSet)
router.register(r'creator-profiles', CreatorProfileViewSet)
router.register(r'client-profiles', ClientProfileViewSet)
router.register(r'project-categories', ProjectCategoryViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'project-applications', ProjectApplicationViewSet)
router.register(r'project-contracts', ProjectContractViewSet)
router.register(r'project-reviews', ProjectReviewViewSet)

# Social Media - Posts and Comments
router.register(r'posts', PostViewSet, basename='post')
router.register(r'comments', CommentViewSet, basename='comment')

urlpatterns = [
    # Google OAuth2 authentication endpoints
    path('auth/google/', google_auth, name='google_auth'),
    path('auth/google/config/', google_auth_config, name='google_auth_config'),
    
    # Unread count endpoints - Must be before router.urls to avoid conflict
    path('notifications/unread_count/', unread_notifications_count, name='unread_notifications_count'),
    
    # API endpoints
    path('', include(router.urls)),
    
    # Blog engagement endpoints
    path('blog/<int:blog_id>/like/', blog_like, name='blog_like'),
    path('blog/<int:blog_id>/comments/', blog_comments, name='blog_comments'),
    path('blog/comments/<int:comment_id>/like/', blog_comment_like, name='blog_comment_like'),
    
    # Follow system endpoints
    path('follow/', include('core.follow_urls')),
]
