from django.urls import path
from . import views
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('', views.home, name='home'),
    path('portfolio/<int:id>/', views.portfolio_detail, name='portfolio-detail'),
    path('service/<slug:slug>/', views.service_detail, name='service-detail'),
    path('blog/<slug:slug>/', views.blog_detail, name='blog-detail'),  # Add this!
    path('starter/', views.starter, name='starter-page'),
    path('about/', views.about, name='about-page'),
    path('team/', views.team, name='team'),
    path('profile/', views.profile, name='profile'),
    path('profile/edit/', views.edit_profile, name='edit_profile'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('accounts/', include('django.contrib.auth.urls')),  # For login/logout
]
# vikrahub/core/urls.py
# This file defines the URL patterns for the core app of the Vikra Hub project.
from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(
        settings.STATIC_URL,
        document_root=settings.STATICFILES_DIRS[0]
    )
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
