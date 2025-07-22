from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import (
    Service, PortfolioItem, BlogPost, TeamMember, AssetCategory, CreativeAsset,
    UserProfile, FreelancerProfile, Notification, ProjectCategory, Project,
    ProjectApplication, ProjectContract, ProjectReview, AssetPurchase, AssetReview
)

# Register your models here.

# User Profile Inline
class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'
    fk_name = 'user'

# Freelancer Profile Inline
class FreelancerProfileInline(admin.StackedInline):
    model = FreelancerProfile
    can_delete = False
    verbose_name_plural = 'Freelancer Profile'
    fk_name = 'user'

# Custom User Admin
class CustomUserAdmin(UserAdmin):
    inlines = (UserProfileInline, )
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'get_user_type', 'date_joined')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'date_joined', 'userprofile__user_type')
    search_fields = ('username', 'first_name', 'last_name', 'email')
    
    def get_user_type(self, obj):
        try:
            return obj.userprofile.user_type
        except UserProfile.DoesNotExist:
            return 'No Profile'
    get_user_type.short_description = 'User Type'

# Unregister the default User admin and register our custom one
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)

# UserProfile Admin
@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'user_type', 'headline', 'skills', 'website']
    list_filter = ['user_type']
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'headline', 'skills']
    readonly_fields = ['user']

# FreelancerProfile Admin
@admin.register(FreelancerProfile)
class FreelancerProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'hourly_rate', 'skill_level', 'rating', 'is_verified', 'is_available']
    list_filter = ['skill_level', 'is_verified', 'is_available', 'created_at']
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'title']
    readonly_fields = ['rating', 'total_jobs', 'completed_jobs', 'created_at']
    
    fieldsets = (
        ('User Information', {
            'fields': ('user',)
        }),
        ('Professional Details', {
            'fields': ('title', 'hourly_rate', 'availability', 'skill_level', 'years_experience')
        }),
        ('Portfolio & Links', {
            'fields': ('portfolio_url',)
        }),
        ('Status & Verification', {
            'fields': ('is_available', 'is_verified')
        }),
        ('Performance Metrics', {
            'fields': ('rating', 'total_jobs', 'completed_jobs'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        })
    )

# Notification Admin
@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'message', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['user__username', 'message']
    readonly_fields = ['created_at', 'updated_at']

admin.site.register(Service)
admin.site.register(PortfolioItem)
admin.site.register(BlogPost)
admin.site.register(TeamMember)
admin.site.register(AssetCategory)

@admin.register(CreativeAsset)
class CreativeAssetAdmin(admin.ModelAdmin):
    list_display = ['title', 'seller', 'category', 'asset_type', 'price', 'is_active', 'created_at']
    list_filter = ['category', 'asset_type', 'is_active', 'created_at']
    search_fields = ['title', 'description', 'tags']
    readonly_fields = ['downloads', 'rating', 'review_count', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'seller', 'category', 'asset_type', 'price')
        }),
        ('Asset Files (Use Cloudinary URLs)', {
            'fields': ('preview_image', 'asset_files'),
            'description': 'Upload your files to Cloudinary first, then paste the URLs here. '
                          'For images: Use Cloudinary\'s image URLs. '
                          'For files: Upload ZIP files to Cloudinary and use the raw file URL.'
        }),
        ('Metadata', {
            'fields': ('tags', 'software_used', 'file_formats'),
            'classes': ('collapse',)
        }),
        ('Status & Metrics', {
            'fields': ('is_active', 'downloads', 'rating', 'review_count'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
