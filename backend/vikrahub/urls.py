from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.utils import timezone
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

def api_root(request):
    """Root API endpoint providing information about available endpoints."""
    return JsonResponse({
        'message': 'Welcome to VikraHub API',
        'version': '1.0',
        'status': 'healthy',
        'timestamp': str(timezone.now()),
        'endpoints': {
            'api': '/api/',
            'admin': '/admin/',
            'auth': {
                'token': '/api/auth/token/',
                'refresh': '/api/auth/token/refresh/',
            },
            'core_resources': {
                'users': '/api/users/',
                'services': '/api/services/',
                'portfolio': '/api/portfolio/',
                'team': '/api/team/',
                'blog': '/api/blog/',
                'notifications': '/api/notifications/',
                'public_profiles': '/api/public-profiles/',
            },
            'marketplace': {
                'asset_categories': '/api/asset-categories/',
                'creative_assets': '/api/creative-assets/',
                'asset_purchases': '/api/asset-purchases/',
                'asset_reviews': '/api/asset-reviews/',
            },
            'freelancer_platform': {
                'freelancer_profiles': '/api/freelancer-profiles/',
                'project_categories': '/api/project-categories/',
                'projects': '/api/projects/',
                'project_applications': '/api/project-applications/',
                'project_contracts': '/api/project-contracts/',
                'project_reviews': '/api/project-reviews/',
            },
            'messaging': {
                'conversations': '/api/messaging/conversations/',
                'messages': '/api/messaging/messages/',
                'websocket': 'ws://your-domain/ws/messaging/',
            }
        },
        'documentation': 'Visit /api/ for browsable API interface'
    })

urlpatterns = [
    # Root API info endpoint
    path('', api_root, name='api_root'),
    
    # API status endpoint (for testing)
    path('api/', api_root, name='api_status'),
    
    # API endpoints
    path('api/', include('core.urls')),
    path('api/messaging/', include('messaging.urls')),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Admin interface (keep for backend management)
    path('admin/', admin.site.urls),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
# It includes paths for the admin interface, core app views, user authentication, and registration.