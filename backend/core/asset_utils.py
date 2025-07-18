"""
Utilities for Creative Assets Marketplace
Handles file validation, processing, and marketplace operations
"""
import re
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.db.models import Avg, Q, Count
from .cloudinary_utils import validate_cloudinary_url


def validate_asset_price(price):
    """Validate asset price is within acceptable range"""
    if price < Decimal('0.01'):
        raise ValidationError("Price must be at least $0.01")
    if price > Decimal('999999.99'):
        raise ValidationError("Price cannot exceed $999,999.99")
    return price


def validate_asset_tags(tags):
    """Validate and clean asset tags"""
    if not tags:
        return ""
    
    # Split by comma and clean each tag
    tag_list = [tag.strip().lower() for tag in tags.split(',')]
    
    # Remove empty tags
    tag_list = [tag for tag in tag_list if tag]
    
    # Validate each tag
    for tag in tag_list:
        if len(tag) < 2:
            raise ValidationError(f"Tag '{tag}' is too short (minimum 2 characters)")
        if len(tag) > 30:
            raise ValidationError(f"Tag '{tag}' is too long (maximum 30 characters)")
        if not re.match(r'^[a-zA-Z0-9\s_-]+$', tag):
            raise ValidationError(f"Tag '{tag}' contains invalid characters")
    
    # Limit number of tags
    if len(tag_list) > 20:
        raise ValidationError("Maximum 20 tags allowed")
    
    return ', '.join(tag_list)


def get_asset_file_info(cloudinary_url):
    """Extract file information from Cloudinary URL"""
    try:
        validate_cloudinary_url(cloudinary_url)
        
        # Extract public_id and file info from URL
        # Example: https://res.cloudinary.com/demo/raw/upload/v1234567890/assets/design_pack.zip
        url_parts = cloudinary_url.split('/')
        
        info = {
            'is_valid': True,
            'file_type': 'unknown',
            'estimated_size': 'unknown'
        }
        
        # Try to determine file type from URL
        if 'raw/upload' in cloudinary_url:
            info['file_type'] = 'archive'
        elif 'image/upload' in cloudinary_url:
            info['file_type'] = 'image'
        elif 'video/upload' in cloudinary_url:
            info['file_type'] = 'video'
        
        return info
    except ValidationError:
        return {'is_valid': False, 'error': 'Invalid Cloudinary URL'}


def calculate_asset_rating(asset):
    """Calculate and update asset rating based on reviews"""
    from .models import AssetReview
    
    reviews = AssetReview.objects.filter(asset=asset)
    if reviews.exists():
        avg_rating = reviews.aggregate(avg_rating=Avg('rating'))['avg_rating']
        asset.rating = round(avg_rating, 2)
        asset.review_count = reviews.count()
    else:
        asset.rating = 0.00
        asset.review_count = 0
    
    asset.save(update_fields=['rating', 'review_count'])
    return asset.rating


def get_recommended_assets(user, limit=10):
    """Get recommended assets based on user's purchase history and preferences"""
    from .models import CreativeAsset, AssetPurchase
    
    # Get user's purchase history
    purchased_assets = AssetPurchase.objects.filter(buyer=user).values_list('asset', flat=True)
    
    if not purchased_assets:
        # For new users, return popular assets
        return CreativeAsset.objects.filter(
            is_active=True
        ).order_by('-downloads', '-rating')[:limit]
    
    # Get categories and tags from purchased assets
    purchased_categories = CreativeAsset.objects.filter(
        id__in=purchased_assets
    ).values_list('category', flat=True).distinct()
    
    purchased_tags = []
    for asset in CreativeAsset.objects.filter(id__in=purchased_assets):
        purchased_tags.extend(asset.get_tags_list())
    
    # Find similar assets
    similar_assets = CreativeAsset.objects.filter(
        Q(category__in=purchased_categories) | 
        Q(tags__icontains='|'.join(set(purchased_tags[:10]))),  # Top 10 most common tags
        is_active=True
    ).exclude(
        id__in=purchased_assets  # Exclude already purchased
    ).distinct().order_by('-rating', '-downloads')[:limit]
    
    return similar_assets


def get_asset_search_results(query, category=None, asset_type=None, min_price=None, max_price=None, sort_by='relevance'):
    """Advanced search for assets"""
    from .models import CreativeAsset
    
    # Start with active assets
    assets = CreativeAsset.objects.filter(is_active=True)
    
    # Apply text search
    if query:
        assets = assets.filter(
            Q(title__icontains=query) |
            Q(description__icontains=query) |
            Q(tags__icontains=query)
        )
    
    # Apply filters
    if category:
        assets = assets.filter(category=category)
    
    if asset_type:
        assets = assets.filter(asset_type=asset_type)
    
    if min_price is not None:
        assets = assets.filter(price__gte=min_price)
    
    if max_price is not None:
        assets = assets.filter(price__lte=max_price)
    
    # Apply sorting
    if sort_by == 'price_low':
        assets = assets.order_by('price')
    elif sort_by == 'price_high':
        assets = assets.order_by('-price')
    elif sort_by == 'rating':
        assets = assets.order_by('-rating', '-review_count')
    elif sort_by == 'downloads':
        assets = assets.order_by('-downloads')
    elif sort_by == 'newest':
        assets = assets.order_by('-created_at')
    else:  # relevance (default)
        assets = assets.order_by('-rating', '-downloads', '-created_at')
    
    return assets


def validate_asset_purchase(user, asset):
    """Validate if user can purchase an asset"""
    from .models import AssetPurchase
    
    # Check if user is the seller
    if asset.seller == user:
        raise ValidationError("You cannot purchase your own asset")
    
    # Check if already purchased
    if AssetPurchase.objects.filter(buyer=user, asset=asset).exists():
        raise ValidationError("You have already purchased this asset")
    
    # Check if asset is active
    if not asset.is_active:
        raise ValidationError("This asset is not available for purchase")
    
    return True


def process_asset_purchase(user, asset):
    """Process an asset purchase"""
    from .models import AssetPurchase
    
    # Validate purchase
    validate_asset_purchase(user, asset)
    
    # Create purchase record
    purchase = AssetPurchase.objects.create(
        buyer=user,
        asset=asset,
        price_paid=asset.price
    )
    
    # Update asset download count
    asset.downloads += 1
    asset.save(update_fields=['downloads'])
    
    # TODO: Process payment with payment gateway
    # This would integrate with Stripe, PayPal, etc.
    
    return purchase


def get_seller_stats(seller):
    """Get statistics for a seller"""
    from .models import CreativeAsset, AssetPurchase, AssetReview
    
    assets = CreativeAsset.objects.filter(seller=seller)
    
    stats = {
        'total_assets': assets.count(),
        'active_assets': assets.filter(is_active=True).count(),
        'total_downloads': sum(asset.downloads for asset in assets),
        'total_revenue': sum(
            purchase.price_paid for purchase in AssetPurchase.objects.filter(asset__seller=seller)
        ),
        'average_rating': 0.0,
        'total_reviews': 0
    }
    
    # Calculate average rating across all assets
    reviews = AssetReview.objects.filter(asset__seller=seller)
    if reviews.exists():
        stats['average_rating'] = reviews.aggregate(avg_rating=Avg('rating'))['avg_rating']
        stats['total_reviews'] = reviews.count()
    
    return stats


def get_trending_assets(days=7, limit=10):
    """Get trending assets based on recent downloads and ratings"""
    from django.utils import timezone
    from datetime import timedelta
    from .models import CreativeAsset, AssetPurchase
    
    # Get assets with recent activity
    recent_date = timezone.now() - timedelta(days=days)
    
    # Get assets with recent purchases
    trending_assets = CreativeAsset.objects.filter(
        is_active=True,
        assetpurchase__purchase_date__gte=recent_date
    ).annotate(
        recent_purchases=Count('assetpurchase__id', 
            filter=Q(assetpurchase__purchase_date__gte=recent_date))
    ).order_by('-recent_purchases', '-rating', '-downloads')[:limit]
    
    return trending_assets
