"""
VikraHub SEO Sitemaps
This module defines sitemap classes for different sections of the VikraHub platform
to improve search engine optimization and discoverability.
"""

from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from django.utils import timezone
from .models import BlogPost


class StaticViewSitemap(Sitemap):
    """
    Sitemap for static pages of VikraHub.
    Includes main navigation and important static content pages.
    """
    priority = 0.8
    changefreq = 'weekly'
    protocol = 'https'

    def items(self):
        """Return a list of static page URL names"""
        return [
            'api_root',  # Home page 
            # Note: Add more static URL names as your frontend routes grow
            # These would correspond to your React frontend routes
        ]

    def location(self, item):
        """Return the URL for each static page"""
        if item == 'api_root':
            return '/'
        return reverse(item)

    def lastmod(self, obj):
        """Return the last modification date for static pages"""
        return timezone.now().date()


class BlogSitemap(Sitemap):
    """
    Sitemap for blog posts.
    Includes all published blog posts with dynamic lastmod dates.
    """
    changefreq = 'daily'
    priority = 0.6
    protocol = 'https'

    def items(self):
        """Return all published blog posts"""
        return BlogPost.objects.filter(published=True).order_by('-updated_at')

    def lastmod(self, obj):
        """Return the last modification date for each blog post"""
        return obj.updated_at

    def location(self, obj):
        """Return the URL for each blog post"""
        # This assumes your frontend has a route like /blog/[slug]
        # Adjust the URL pattern based on your actual frontend routing
        return f'/blog/{obj.slug}/'


class APISitemap(Sitemap):
    """
    Sitemap for important API endpoints that should be discoverable.
    Includes main API documentation and public endpoints.
    """
    priority = 0.5
    changefreq = 'monthly'
    protocol = 'https'

    def items(self):
        """Return API endpoint names"""
        return [
            'api_status',  # Main API documentation endpoint
        ]

    def location(self, item):
        """Return the URL for API endpoints"""
        return reverse(item)

    def lastmod(self, obj):
        """Return last modification date for API endpoints"""
        return timezone.now().date()


class PortfolioSitemap(Sitemap):
    """
    Future sitemap for portfolio pages.
    This can be expanded when you want individual portfolio items to be indexed.
    """
    priority = 0.4
    changefreq = 'weekly'
    protocol = 'https'

    def items(self):
        """Return portfolio-related static pages"""
        return []  # Add portfolio URL names when ready

    def location(self, item):
        """Return the URL for portfolio pages"""
        return reverse(item)

    def lastmod(self, obj):
        """Return last modification date"""
        return timezone.now().date()
