from django.urls import path
from .views import blog_share_page

urlpatterns = [
    path('', blog_share_page, name='blog_share_page'),
]
