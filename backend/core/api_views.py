import logging

from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, IsAdminUser
from django.contrib.auth.models import User
from django.db.models import Q, Avg
from django.utils import timezone
from django.core.exceptions import ValidationError
from .asset_utils import (
    get_recommended_assets, get_asset_search_results, validate_asset_purchase,
    process_asset_purchase, get_seller_stats, get_trending_assets, calculate_asset_rating
)
from .models import (
    TeamMember, Service, PortfolioItem, BlogPost, UserProfile, Notification,
    AssetCategory, CreativeAsset, AssetPurchase, AssetReview,
    FreelancerProfile, CreatorProfile, ClientProfile, ProjectCategory, Project, 
    ProjectApplication, ProjectContract, ProjectReview,
    Post, Like, Comment, CommentLike, BlogLike, BlogComment, BlogCommentLike
)
from .serializers import (
    UserSerializer, UserProfileSerializer, PublicUserProfileSerializer,
    TeamMemberSerializer, ServiceSerializer, PortfolioItemSerializer, 
    BlogPostSerializer, NotificationSerializer, AssetCategorySerializer, 
    CreativeAssetSerializer, AssetPurchaseSerializer, AssetReviewSerializer, 
    FreelancerProfileSerializer, CreatorProfileSerializer, ClientProfileSerializer,
    ProjectCategorySerializer, ProjectSerializer, ProjectApplicationSerializer, 
    ProjectContractSerializer, ProjectReviewSerializer,
    PostSerializer, LikeSerializer, CommentSerializer, CommentLikeSerializer,
    BlogLikeSerializer, BlogCommentSerializer
)

# Setup logging
logger = logging.getLogger(__name__)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action == 'create':
            # Allow unauthenticated users to register
            permission_classes = []
        elif self.action in ['list', 'retrieve', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user profile"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAdminUser])
    def activate(self, request, pk=None):
        """Activate a user account"""
        user = self.get_object()
        user.is_active = True
        user.save()
        return Response({'status': 'User activated'})
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAdminUser])
    def deactivate(self, request, pk=None):
        """Deactivate a user account"""
        user = self.get_object()
        user.is_active = False
        user.save()
        return Response({'status': 'User deactivated'})
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAdminUser])
    def make_staff(self, request, pk=None):
        """Make user a staff member"""
        user = self.get_object()
        user.is_staff = True
        user.save()
        return Response({'status': 'User made staff'})
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAdminUser])
    def remove_staff(self, request, pk=None):
        """Remove staff privileges from user"""
        user = self.get_object()
        user.is_staff = False
        user.save()
        return Response({'status': 'Staff privileges removed'})
    
    @action(detail=False, methods=['get'], url_path='username/(?P<username>[^/.]+)')
    def get_by_username(self, request, username=None):
        """Get user by username for chat functionality"""
        try:
            user = User.objects.get(username=username)
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        """Get current user's profile"""
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(profile, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['patch', 'put'])
    def update_profile(self, request):
        """Update current user's profile"""
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def validate_cloudinary_url(self, request):
        """Validate a Cloudinary URL"""
        from .cloudinary_utils import validate_cloudinary_url, get_optimized_avatar_url
        
        url = request.data.get('url')
        if not url:
            return Response({'error': 'URL is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            validate_cloudinary_url(url)
            return Response({
                'valid': True,
                'url': url,
                'optimized_urls': {
                    'small': get_optimized_avatar_url(url, 100),
                    'medium': get_optimized_avatar_url(url, 200),
                    'large': get_optimized_avatar_url(url, 400)
                }
            })
        except Exception as e:
            return Response({
                'valid': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class PublicUserProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public user profiles viewset - allows anyone to view user profiles
    with only public information (no email, social media, etc.)
    """
    queryset = UserProfile.objects.select_related('user').all()
    serializer_class = PublicUserProfileSerializer
    permission_classes = []  # No authentication required
    lookup_field = 'user__username'  # Allow lookup by username instead of ID
    
    def get_queryset(self):
        """Filter out inactive users and admin accounts"""
        return UserProfile.objects.select_related('user').filter(
            user__is_active=True
        ).exclude(user__is_staff=True)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search public profiles by username, name, or skills"""
        query = request.query_params.get('q', '')
        user_type = request.query_params.get('type', '')
        
        queryset = self.get_queryset()
        
        if query:
            queryset = queryset.filter(
                Q(user__username__icontains=query) |
                Q(user__first_name__icontains=query) |
                Q(user__last_name__icontains=query) |
                Q(skills__icontains=query) |
                Q(bio__icontains=query)
            )
        
        if user_type:
            queryset = queryset.filter(user_type=user_type)
        
        # Paginate results
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class TeamMemberViewSet(viewsets.ModelViewSet):
    queryset = TeamMember.objects.all()
    serializer_class = TeamMemberSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class PortfolioItemViewSet(viewsets.ModelViewSet):
    queryset = PortfolioItem.objects.all()
    serializer_class = PortfolioItemSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class BlogPostViewSet(viewsets.ModelViewSet):
    serializer_class = BlogPostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'  # Enable slug-based lookups
    
    def get_queryset(self):
        """Return all published blogs, ordered by creation date"""
        return BlogPost.objects.filter(published=True).order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
    
    @action(detail=False, methods=['get'])
    def all_posts(self, request):
        """Get all published blog posts from all users"""
        try:
            posts = BlogPost.objects.filter(published=True).order_by('-created_at')
            serializer = self.get_serializer(posts, many=True)
            return Response({
                'count': posts.count(),
                'results': serializer.data
            })
        except Exception as e:
            logger.error(f"Error fetching all blog posts: {e}")
            return Response({
                'error': 'Failed to fetch blog posts',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def my_posts(self, request):
        """Get current user's blog posts with authentication check"""
        if not request.user.is_authenticated:
            return Response({
                'error': 'Authentication required',
                'detail': 'You must be logged in to view your posts'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            posts = BlogPost.objects.filter(author=request.user).order_by('-created_at')
            serializer = self.get_serializer(posts, many=True)
            return Response({
                'count': posts.count(),
                'results': serializer.data
            })
        except Exception as e:
            logger.error(f"Error fetching user posts: {e}")
            return Response({
                'error': 'Failed to fetch posts',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        
        # Send real-time unread count update
        self.send_unread_count_update(request.user)
        
        return Response({'status': 'notification marked as read'})
    
    def send_unread_count_update(self, user):
        """Send real-time unread count update to user"""
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            from django.utils import timezone
            
            # Calculate current unread counts
            from messaging.models import Message
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
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to send unread count update: {e}")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_notifications_count(request):
    """Get count of unread notifications for the authenticated user with enhanced error handling"""
    try:
        # Try to get notification count (primary method)
        try:
            count = Notification.objects.filter(
                user=request.user,
                is_read=False
            ).count()
        except Exception as notification_error:
            print(f"⚠️ Notification count error: {notification_error}")
            # Fallback to message-based count
            try:
                from core.models import Message
                count = Message.objects.filter(
                    recipient=request.user,
                    is_read=False
                ).count()
            except Exception as message_error:
                print(f"⚠️ Message count error: {message_error}")
                count = 0
        
        return Response({
            'unread_count': count,
            'status': 'success',
            'timestamp': timezone.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Critical error in unread_notifications_count: {e}")
        # Always return a valid response to prevent frontend errors
        return Response({
            'unread_count': 0,
            'status': 'error',
            'message': 'Could not fetch notification count'
        }, status=status.HTTP_200_OK)


# Creative Assets Marketplace ViewSets
class AssetCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AssetCategory.objects.all()
    serializer_class = AssetCategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class CreativeAssetViewSet(viewsets.ModelViewSet):
    queryset = CreativeAsset.objects.filter(is_active=True)
    serializer_class = CreativeAssetSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        """Enhanced search with asset_utils"""
        query = self.request.query_params.get('search', '')
        category = self.request.query_params.get('category', None)
        asset_type = self.request.query_params.get('type', None)
        min_price = self.request.query_params.get('min_price', None)
        max_price = self.request.query_params.get('max_price', None)
        sort_by = self.request.query_params.get('sort', 'relevance')
        
        # Convert string prices to Decimal
        if min_price:
            try:
                min_price = float(min_price)
            except ValueError:
                min_price = None
        
        if max_price:
            try:
                max_price = float(max_price)
            except ValueError:
                max_price = None
        
        # Use advanced search from asset_utils
        return get_asset_search_results(
            query=query,
            category=category,
            asset_type=asset_type,
            min_price=min_price,
            max_price=max_price,
            sort_by=sort_by
        )
    
    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_assets(self, request):
        """Get current user's assets with authentication check"""
        if not request.user.is_authenticated:
            return Response({
                'error': 'Authentication required',
                'detail': 'You must be logged in to view your assets'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            assets = CreativeAsset.objects.filter(seller=request.user).order_by('-created_at')
            serializer = self.get_serializer(assets, many=True)
            return Response({
                'count': assets.count(),
                'results': serializer.data
            })
        except Exception as e:
            logger.error(f"Error fetching user assets: {e}")
            return Response({
                'error': 'Failed to fetch assets',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def trending(self, request):
        """Get trending assets"""
        days = int(request.query_params.get('days', 7))
        limit = int(request.query_params.get('limit', 10))
        
        trending_assets = get_trending_assets(days=days, limit=limit)
        serializer = self.get_serializer(trending_assets, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def recommended(self, request):
        """Get recommended assets for user"""
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        limit = int(request.query_params.get('limit', 10))
        recommended_assets = get_recommended_assets(request.user, limit=limit)
        serializer = self.get_serializer(recommended_assets, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def purchase(self, request, pk=None):
        """Purchase an asset"""
        asset = self.get_object()
        
        try:
            purchase = process_asset_purchase(request.user, asset)
            from .serializers import AssetPurchaseSerializer
            serializer = AssetPurchaseSerializer(purchase)
            return Response({
                'message': 'Asset purchased successfully',
                'purchase': serializer.data
            }, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def download(self, request, pk=None):
        """Download purchased asset"""
        asset = self.get_object()
        
        # Check if user purchased the asset
        try:
            purchase = AssetPurchase.objects.get(buyer=request.user, asset=asset)
        except AssetPurchase.DoesNotExist:
            return Response({'error': 'You must purchase this asset first'}, status=status.HTTP_403_FORBIDDEN)
        
        # Check download limit
        if purchase.download_count >= purchase.max_downloads:
            return Response({'error': 'Download limit exceeded'}, status=status.HTTP_403_FORBIDDEN)
        
        # Increment download count
        purchase.download_count += 1
        purchase.save()
        
        return Response({
            'download_url': asset.asset_files,
            'downloads_remaining': purchase.max_downloads - purchase.download_count
        })
    
    @action(detail=False, methods=['get'])
    def seller_stats(self, request):
        """Get seller statistics for current user"""
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        stats = get_seller_stats(request.user)
        return Response(stats)
        
        # Update asset download count
        asset.downloads += 1
        asset.save()
        
        serializer = AssetPurchaseSerializer(purchase)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download purchased asset"""
        asset = self.get_object()
        
        try:
            purchase = AssetPurchase.objects.get(buyer=request.user, asset=asset)
        except AssetPurchase.DoesNotExist:
            return Response(
                {'error': 'You must purchase this asset first'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if purchase.download_count >= purchase.max_downloads:
            return Response(
                {'error': 'Download limit exceeded'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        purchase.download_count += 1
        purchase.save()
        
        # Return download URL or file
        return Response({
            'download_url': asset.asset_files.url,
            'downloads_remaining': purchase.max_downloads - purchase.download_count
        })

class AssetPurchaseViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AssetPurchase.objects.all()
    serializer_class = AssetPurchaseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return AssetPurchase.objects.filter(buyer=self.request.user).select_related('asset', 'asset__seller')
    
    @action(detail=True, methods=['post'])
    def download(self, request, pk=None):
        """Download a purchased asset"""
        purchase = self.get_object()
        
        # Check download limit
        if purchase.download_count >= purchase.max_downloads:
            return Response(
                {'error': f'Download limit exceeded. Maximum {purchase.max_downloads} downloads allowed.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Increment download count
        purchase.download_count += 1
        purchase.save()
        
        return Response({
            'download_url': purchase.asset.asset_files,
            'downloads_used': purchase.download_count,
            'downloads_remaining': purchase.max_downloads - purchase.download_count,
            'asset_title': purchase.asset.title
        })
    
    @action(detail=False, methods=['get'])
    def download_history(self, request):
        """Get download history for user's purchases"""
        purchases = self.get_queryset().filter(download_count__gt=0)
        serializer = self.get_serializer(purchases, many=True)
        return Response(serializer.data)

class AssetReviewViewSet(viewsets.ModelViewSet):
    queryset = AssetReview.objects.all()
    serializer_class = AssetReviewSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        asset_id = self.request.query_params.get('asset', None)
        if asset_id:
            return AssetReview.objects.filter(asset__id=asset_id)
        
        # Show reviews for user's purchased assets or assets they've reviewed
        user_purchases = AssetPurchase.objects.filter(buyer=self.request.user).values_list('asset', flat=True)
        user_reviews = AssetReview.objects.filter(reviewer=self.request.user).values_list('asset', flat=True)
        
        return AssetReview.objects.filter(
            Q(asset__in=user_purchases) | Q(asset__in=user_reviews)
        )
    
    def perform_create(self, serializer):
        asset = serializer.validated_data['asset']
        
        # Check if user purchased the asset
        if not AssetPurchase.objects.filter(buyer=self.request.user, asset=asset).exists():
            raise serializers.ValidationError("You can only review assets you've purchased")
        
        # Check if user already reviewed this asset
        if AssetReview.objects.filter(asset=asset, reviewer=self.request.user).exists():
            raise serializers.ValidationError("You have already reviewed this asset")
        
        serializer.save(reviewer=self.request.user)
        
        # Update asset rating using utility function
        calculate_asset_rating(asset)
    
    def perform_update(self, serializer):
        serializer.save()
        
        # Update asset rating after review update
        asset = serializer.instance.asset
        calculate_asset_rating(asset)
    
    def perform_destroy(self, instance):
        asset = instance.asset
        super().perform_destroy(instance)
        
        # Update asset rating after review deletion
        calculate_asset_rating(asset)


# Freelancer Booking System ViewSets
class FreelancerProfileViewSet(viewsets.ModelViewSet):
    queryset = FreelancerProfile.objects.filter(is_available=True)
    serializer_class = FreelancerProfileSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        skills = self.request.query_params.get('skills', None)
        min_rate = self.request.query_params.get('min_rate', None)
        max_rate = self.request.query_params.get('max_rate', None)
        skill_level = self.request.query_params.get('skill_level', None)
        
        if skills:
            # Search in user's skills from UserProfile
            queryset = queryset.filter(user__userprofile__skills__icontains=skills)
        if min_rate:
            queryset = queryset.filter(hourly_rate__gte=min_rate)
        if max_rate:
            queryset = queryset.filter(hourly_rate__lte=max_rate)
        if skill_level:
            queryset = queryset.filter(skill_level=skill_level)
            
        return queryset.order_by('-rating', '-created_at')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        """Get current user's freelancer profile"""
        try:
            profile = FreelancerProfile.objects.get(user=request.user)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except FreelancerProfile.DoesNotExist:
            return Response(
                {'error': 'Freelancer profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

class CreatorProfileViewSet(viewsets.ModelViewSet):
    queryset = CreatorProfile.objects.filter(is_featured=True)
    serializer_class = CreatorProfileSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = CreatorProfile.objects.all()
        creator_type = self.request.query_params.get('creator_type', None)
        experience_level = self.request.query_params.get('experience_level', None)
        available_for_commissions = self.request.query_params.get('available_for_commissions', None)
        featured = self.request.query_params.get('featured', None)
        
        if creator_type:
            queryset = queryset.filter(creator_type=creator_type)
        if experience_level:
            queryset = queryset.filter(experience_level=experience_level)
        if available_for_commissions is not None:
            queryset = queryset.filter(available_for_commissions=available_for_commissions.lower() == 'true')
        if featured is not None:
            queryset = queryset.filter(is_featured=featured.lower() == 'true')
            
        # Order by featured first, then by followers count
        return queryset.order_by('-is_featured', '-followers_count', '-created_at')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        """Get current user's creator profile"""
        try:
            profile = CreatorProfile.objects.get(user=request.user)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except CreatorProfile.DoesNotExist:
            return Response(
                {'error': 'Creator profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured creators for homepage"""
        featured_creators = CreatorProfile.objects.filter(is_featured=True)[:3]
        serializer = self.get_serializer(featured_creators, many=True)
        return Response(serializer.data)

class ClientProfileViewSet(viewsets.ModelViewSet):
    queryset = ClientProfile.objects.all()
    serializer_class = ClientProfileSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        client_type = self.request.query_params.get('client_type', None)
        company_size = self.request.query_params.get('company_size', None)
        is_verified = self.request.query_params.get('is_verified', None)
        
        if client_type:
            queryset = queryset.filter(client_type=client_type)
        if company_size:
            queryset = queryset.filter(company_size=company_size)
        if is_verified is not None:
            queryset = queryset.filter(is_verified=is_verified.lower() == 'true')
            
        return queryset.order_by('-is_verified', '-total_spent', '-created_at')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        """Get current user's client profile"""
        try:
            profile = ClientProfile.objects.get(user=request.user)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except ClientProfile.DoesNotExist:
            return Response(
                {'error': 'Client profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

class ProjectCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ProjectCategory.objects.all()
    serializer_class = ProjectCategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.filter(status='open')
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category', None)
        budget_min = self.request.query_params.get('budget_min', None)
        budget_max = self.request.query_params.get('budget_max', None)
        skills = self.request.query_params.get('skills', None)
        
        if category:
            queryset = queryset.filter(category__id=category)
        if budget_min:
            queryset = queryset.filter(budget_min__gte=budget_min)
        if budget_max:
            queryset = queryset.filter(budget_max__lte=budget_max)
        if skills:
            queryset = queryset.filter(required_skills__icontains=skills)
            
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(client=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_projects(self, request):
        """Get current user's posted projects"""
        projects = Project.objects.filter(client=request.user)
        serializer = self.get_serializer(projects, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def select_freelancer(self, request, pk=None):
        """Select a freelancer for the project"""
        project = self.get_object()
        
        if project.client != request.user:
            return Response(
                {'error': 'Only project owner can select freelancer'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        freelancer_id = request.data.get('freelancer_id')
        if not freelancer_id:
            return Response(
                {'error': 'freelancer_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            application = ProjectApplication.objects.get(
                project=project, 
                freelancer__id=freelancer_id,
                status='pending'
            )
        except ProjectApplication.DoesNotExist:
            return Response(
                {'error': 'Application not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Update project and application
        project.selected_freelancer_id = freelancer_id
        project.status = 'in_progress'
        project.save()
        
        application.status = 'accepted'
        application.save()
        
        # Reject other applications
        ProjectApplication.objects.filter(project=project).exclude(
            id=application.id
        ).update(status='rejected')
        
        return Response({'status': 'freelancer selected successfully'})

class ProjectApplicationViewSet(viewsets.ModelViewSet):
    queryset = ProjectApplication.objects.all()
    serializer_class = ProjectApplicationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if self.request.query_params.get('my_applications'):
            return ProjectApplication.objects.filter(freelancer=user)
        elif self.request.query_params.get('project_id'):
            project_id = self.request.query_params.get('project_id')
            project = Project.objects.get(id=project_id, client=user)
            return ProjectApplication.objects.filter(project=project)
        return ProjectApplication.objects.none()
    
    def perform_create(self, serializer):
        project = serializer.validated_data['project']
        
        # Check if user already applied
        if ProjectApplication.objects.filter(
            project=project, freelancer=self.request.user
        ).exists():
            raise serializers.ValidationError("You already applied to this project")
        
        serializer.save(freelancer=self.request.user)

class ProjectContractViewSet(viewsets.ModelViewSet):
    queryset = ProjectContract.objects.all()
    serializer_class = ProjectContractSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return ProjectContract.objects.filter(
            Q(freelancer=user) | Q(client=user)
        )

class ProjectReviewViewSet(viewsets.ModelViewSet):
    queryset = ProjectReview.objects.all()
    serializer_class = ProjectReviewSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return ProjectReview.objects.filter(
            Q(reviewer=user) | Q(reviewee=user)
        )
    
    def perform_create(self, serializer):
        project = serializer.validated_data['project']
        reviewee = serializer.validated_data['reviewee']
        
        # Determine review type
        if project.client == self.request.user and project.selected_freelancer == reviewee:
            review_type = 'client_to_freelancer'
        elif project.selected_freelancer == self.request.user and project.client == reviewee:
            review_type = 'freelancer_to_client'
        else:
            raise serializers.ValidationError("Invalid review configuration")
        
        serializer.save(reviewer=self.request.user, review_type=review_type)
        
        # Update freelancer rating if reviewing freelancer
        if review_type == 'client_to_freelancer':
            freelancer_reviews = ProjectReview.objects.filter(
                reviewee=reviewee, review_type='client_to_freelancer'
            )
            avg_rating = freelancer_reviews.aggregate(Avg('rating'))['rating__avg']
            
            try:
                freelancer_profile = FreelancerProfile.objects.get(user=reviewee)
                freelancer_profile.rating = round(avg_rating, 2) if avg_rating else 0
                freelancer_profile.save()
            except FreelancerProfile.DoesNotExist:
                pass

# Social Media API Views for Posts, Likes, and Comments
class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        """Return posts based on privacy settings and user authentication"""
        user = self.request.user
        queryset = Post.objects.all()
        
        if not user.is_authenticated:
            # Only show public posts to anonymous users
            queryset = queryset.filter(is_public=True)
        else:
            # Authenticated users see public posts and their own private posts
            queryset = queryset.filter(
                Q(is_public=True) | Q(user=user)
            )
        
        # Filter by category if specified
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by tag if specified
        tag = self.request.query_params.get('tag', None)
        if tag:
            queryset = queryset.filter(tags__icontains=tag)
        
        # Filter by user if specified
        username = self.request.query_params.get('user', None)
        if username:
            queryset = queryset.filter(user__username=username)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        """Set the post creator to the current user"""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        """Like or unlike a post"""
        post = self.get_object()
        user = request.user
        
        # Check if user already liked this post
        like, created = Like.objects.get_or_create(user=user, post=post)
        
        if created:
            # New like
            post.increment_like_count()
            return Response({
                'status': 'liked',
                'like_count': post.like_count,
                'message': 'Post liked successfully'
            })
        else:
            # Unlike
            like.delete()
            post.decrement_like_count()
            return Response({
                'status': 'unliked',
                'like_count': post.like_count,
                'message': 'Post unliked successfully'
            })
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticatedOrReadOnly])
    def comments(self, request, pk=None):
        """Get comments for a post"""
        post = self.get_object()
        comments = Comment.objects.filter(post=post, parent=None).order_by('created_at')
        serializer = CommentSerializer(comments, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def add_comment(self, request, pk=None):
        """Add a comment to a post"""
        post = self.get_object()
        
        if not post.allow_comments:
            return Response(
                {'error': 'Comments are not allowed on this post'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = CommentSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            comment = serializer.save(user=request.user, post=post)
            post.increment_comment_count()
            return Response(CommentSerializer(comment, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def increment_view(self, request, pk=None):
        """Increment view count for a post"""
        post = self.get_object()
        post.view_count += 1
        post.save(update_fields=['view_count'])
        return Response({'view_count': post.view_count})

class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        return Comment.objects.all().order_by('created_at')
    
    def perform_create(self, serializer):
        """Set the comment creator to the current user"""
        post = serializer.validated_data['post']
        if not post.allow_comments:
            raise serializers.ValidationError("Comments are not allowed on this post")
        
        comment = serializer.save(user=self.request.user)
        post.increment_comment_count()
        return comment
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        """Like or unlike a comment"""
        comment = self.get_object()
        user = request.user
        
        # Check if user already liked this comment
        like, created = CommentLike.objects.get_or_create(user=user, comment=comment)
        
        if created:
            # New like
            comment.like_count += 1
            comment.save(update_fields=['like_count'])
            return Response({
                'status': 'liked',
                'like_count': comment.like_count,
                'message': 'Comment liked successfully'
            })
        else:
            # Unlike
            like.delete()
            comment.like_count = max(0, comment.like_count - 1)
            comment.save(update_fields=['like_count'])
            return Response({
                'status': 'unliked',
                'like_count': comment.like_count,
                'message': 'Comment unliked successfully'
            })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reply(self, request, pk=None):
        """Reply to a comment"""
        parent_comment = self.get_object()
        
        serializer = CommentSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            reply = serializer.save(
                user=request.user, 
                post=parent_comment.post,
                parent=parent_comment
            )
            return Response(CommentSerializer(reply, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Blog engagement views
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def blog_like(request, blog_id):
    """Like or unlike a blog post"""
    try:
        blog_post = BlogPost.objects.get(id=blog_id)
    except BlogPost.DoesNotExist:
        return Response({'error': 'Blog post not found'}, status=status.HTTP_404_NOT_FOUND)
    
    user = request.user
    
    # Check if user already liked this blog
    like, created = BlogLike.objects.get_or_create(user=user, blog_post=blog_post)
    
    if created:
        # New like
        blog_post.increment_like_count()
        return Response({
            'status': 'liked',
            'like_count': blog_post.like_count,
            'message': 'Blog post liked successfully'
        })
    else:
        # Unlike
        like.delete()
        blog_post.decrement_like_count()
        return Response({
            'status': 'unliked',
            'like_count': blog_post.like_count,
            'message': 'Blog post unliked successfully'
        })

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
def blog_comments(request, blog_id):
    """Get or add comments for a blog post"""
    try:
        blog_post = BlogPost.objects.get(id=blog_id)
    except BlogPost.DoesNotExist:
        return Response({'error': 'Blog post not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        # Get comments
        comments = BlogComment.objects.filter(blog_post=blog_post, parent=None).order_by('created_at')
        serializer = BlogCommentSerializer(comments, many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Add comment
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        if not blog_post.allow_comments:
            return Response(
                {'error': 'Comments are not allowed on this blog post'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = BlogCommentSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            comment = serializer.save(user=request.user, blog_post=blog_post)
            blog_post.comment_count += 1
            blog_post.save(update_fields=['comment_count'])
            return Response(BlogCommentSerializer(comment, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def blog_comment_like(request, comment_id):
    """Like or unlike a blog comment"""
    try:
        comment = BlogComment.objects.get(id=comment_id)
    except BlogComment.DoesNotExist:
        return Response({'error': 'Comment not found'}, status=status.HTTP_404_NOT_FOUND)
    
    user = request.user
    
    # Check if user already liked this comment
    like, created = BlogCommentLike.objects.get_or_create(user=user, comment=comment)
    
    if created:
        # New like
        comment.like_count += 1
        comment.save(update_fields=['like_count'])
        return Response({
            'status': 'liked',
            'like_count': comment.like_count,
            'message': 'Comment liked successfully'
        })
    else:
        # Unlike
        like.delete()
        comment.like_count = max(0, comment.like_count - 1)
        comment.save(update_fields=['like_count'])
        return Response({
            'status': 'unliked',
            'like_count': comment.like_count,
            'message': 'Comment unliked successfully'
        })
