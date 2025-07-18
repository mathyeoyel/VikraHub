from django.urls import path, include
from rest_framework import routers
from .api_views import (
    UserViewSet, UserProfileViewSet, PublicUserProfileViewSet,
    TeamMemberViewSet, ServiceViewSet, PortfolioItemViewSet, 
    BlogPostViewSet, NotificationViewSet, AssetCategoryViewSet, 
    CreativeAssetViewSet, AssetPurchaseViewSet, AssetReviewViewSet, 
    FreelancerProfileViewSet, ProjectCategoryViewSet, ProjectViewSet, 
    ProjectApplicationViewSet, ProjectContractViewSet, ProjectReviewViewSet
)

# API Router for DRF ViewSets
router = routers.DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'profiles', UserProfileViewSet)
router.register(r'public-profiles', PublicUserProfileViewSet, basename='publicuserprofile')
router.register(r'team', TeamMemberViewSet)
router.register(r'services', ServiceViewSet)
router.register(r'portfolio', PortfolioItemViewSet)
router.register(r'blog', BlogPostViewSet)
router.register(r'notifications', NotificationViewSet)

# Creative Assets Marketplace
router.register(r'asset-categories', AssetCategoryViewSet)
router.register(r'creative-assets', CreativeAssetViewSet)
router.register(r'asset-purchases', AssetPurchaseViewSet)
router.register(r'asset-reviews', AssetReviewViewSet)

# Freelancer Booking System
router.register(r'freelancer-profiles', FreelancerProfileViewSet)
router.register(r'project-categories', ProjectCategoryViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'project-applications', ProjectApplicationViewSet)
router.register(r'project-contracts', ProjectContractViewSet)
router.register(r'project-reviews', ProjectReviewViewSet)

urlpatterns = [
    # API endpoints
    path('', include(router.urls)),
]
