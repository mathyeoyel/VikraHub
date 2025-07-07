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

# The above code defines URL patterns for the core app, linking specific paths to their corresponding view functions.
# The 'name' parameter allows us to refer to these URLs in templates and other parts of the code.
# For example, we can use `{% url 'home' %}` in a template to generate the URL for the home view.
# This makes it easier to manage URLs and ensures that if the URL changes, we only need to update it in one place.