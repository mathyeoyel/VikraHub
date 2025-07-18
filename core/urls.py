from django.urls import path, include
from rest_framework import routers
from .api_views import (
    UserViewSet, UserProfileViewSet, TeamMemberViewSet, 
    ServiceViewSet, PortfolioItemViewSet, BlogPostViewSet, 
    NotificationViewSet
)

# API Router for DRF ViewSets
router = routers.DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'profiles', UserProfileViewSet)
router.register(r'team', TeamMemberViewSet)
router.register(r'services', ServiceViewSet)
router.register(r'portfolio', PortfolioItemViewSet)
router.register(r'blog', BlogPostViewSet)
router.register(r'notifications', NotificationViewSet)

urlpatterns = [
    # API endpoints
    path('', include(router.urls)),
]
