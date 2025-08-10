"""
Cloudinary utilities for Django backend
"""
import re
from urllib.parse import urlparse
from django.core.exceptions import ValidationError
from django.conf import settings


def validate_cloudinary_url(url):
    """
    Validate that a URL is from Cloudinary
    """
    if not url:
        return True  # Allow empty URLs
    
    try:
        parsed = urlparse(url)
        
        # Check if it's a Cloudinary URL
        if not parsed.netloc.endswith('cloudinary.com'):
            raise ValidationError('URL must be from Cloudinary (res.cloudinary.com)')
        
        # Check if it contains the correct cloud name if configured
        cloud_name = getattr(settings, 'CLOUDINARY_CLOUD_NAME', None)
        if cloud_name and cloud_name not in url:
            raise ValidationError(f'URL must contain your Cloudinary cloud name: {cloud_name}')
        
        # Basic URL structure validation
        if not parsed.scheme in ['http', 'https']:
            raise ValidationError('URL must use http or https protocol')
            
        return True
        
    except Exception as e:
        raise ValidationError(f'Invalid Cloudinary URL: {str(e)}')


def extract_cloudinary_public_id(url):
    """
    Extract the public ID from a Cloudinary URL
    Useful for optimization and transformations
    """
    if not url:
        return None
    
    try:
        # Pattern to match Cloudinary URLs and extract public ID
        pattern = r'https?://res\.cloudinary\.com/[^/]+/image/upload/(?:v\d+/)?(.+?)(?:\.[^.]+)?$'
        match = re.search(pattern, url)
        
        if match:
            return match.group(1)
        return None
        
    except Exception:
        return None


def get_cloudinary_transformation_url(url, transformations):
    """
    Generate a Cloudinary URL with transformations
    
    Args:
        url (str): Original Cloudinary URL
        transformations (str): Cloudinary transformation string (e.g., 'w_300,h_300,c_fill')
    
    Returns:
        str: URL with transformations applied
    """
    if not url or not transformations:
        return url
    
    try:
        # Insert transformations into the URL
        if '/image/upload/' in url:
            return url.replace('/image/upload/', f'/image/upload/{transformations}/')
        return url
        
    except Exception:
        return url


def get_optimized_avatar_url(url, size=200):
    """
    Get an optimized avatar URL with specific size and format
    
    Args:
        url (str): Original Cloudinary URL
        size (int): Square size for the avatar
    
    Returns:
        str: Optimized avatar URL
    """
    if not url:
        return url
    
    transformations = f'w_{size},h_{size},c_fill,f_auto,q_auto'
    return get_cloudinary_transformation_url(url, transformations)


def get_responsive_image_urls(url, sizes=[400, 800, 1200]):
    """
    Generate multiple sizes for responsive images
    
    Args:
        url (str): Original Cloudinary URL
        sizes (list): List of widths to generate
    
    Returns:
        dict: Dictionary with size as key and URL as value
    """
    if not url:
        return {}
    
    responsive_urls = {}
    for size in sizes:
        transformations = f'w_{size},f_auto,q_auto'
        responsive_urls[size] = get_cloudinary_transformation_url(url, transformations)
    
    return responsive_urls


def upload_to_cloudinary(file, folder='uploads'):
    """
    Upload a file to Cloudinary and return the URL
    
    Args:
        file: Django UploadedFile or similar file object
        folder (str): Cloudinary folder to upload to
    
    Returns:
        str: Cloudinary URL of uploaded file
    """
    try:
        import cloudinary.uploader
        
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            file,
            folder=folder,
            quality='auto',
            format='auto'
        )
        
        return result.get('secure_url', result.get('url'))
        
    except ImportError:
        raise Exception("Cloudinary library not installed. Install with: pip install cloudinary")
    except Exception as e:
        raise Exception(f"Failed to upload to Cloudinary: {str(e)}")
