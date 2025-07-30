from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import (
    Service, PortfolioItem, BlogPost, TeamMember, AssetCategory, CreativeAsset,
    UserProfile, FreelancerProfile, CreatorProfile, ClientProfile, Notification, 
    ProjectCategory, Project, ProjectApplication, ProjectContract, ProjectReview, 
    AssetPurchase, AssetReview, Post, Like, Comment, CommentLike,
    BlogLike, BlogComment, BlogCommentLike
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

# Creator Profile Inline
class CreatorProfileInline(admin.StackedInline):
    model = CreatorProfile
    can_delete = False
    verbose_name_plural = 'Creator Profile'
    fk_name = 'user'

# Client Profile Inline
class ClientProfileInline(admin.StackedInline):
    model = ClientProfile
    can_delete = False
    verbose_name_plural = 'Client Profile'
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

# CreatorProfile Admin
@admin.register(CreatorProfile)
class CreatorProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'creator_type', 'experience_level', 'available_for_commissions', 'is_featured', 'is_verified']
    list_filter = ['creator_type', 'experience_level', 'available_for_commissions', 'is_featured', 'is_verified', 'created_at']
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'artistic_style', 'art_statement']
    readonly_fields = ['followers_count', 'created_at']
    
    fieldsets = (
        ('User Information', {
            'fields': ('user',)
        }),
        ('Creative Details', {
            'fields': ('creator_type', 'artistic_style', 'experience_level', 'years_active')
        }),
        ('Portfolio & Showcase', {
            'fields': ('portfolio_url', 'featured_work', 'art_statement')
        }),
        ('Professional Background', {
            'fields': ('exhibitions', 'awards'),
            'classes': ('collapse',)
        }),
        ('Commission Settings', {
            'fields': ('available_for_commissions', 'commission_types', 'price_range')
        }),
        ('Status & Verification', {
            'fields': ('is_featured', 'is_verified')
        }),
        ('Social Metrics', {
            'fields': ('followers_count',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        })
    )

# ClientProfile Admin
@admin.register(ClientProfile)
class ClientProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'client_type', 'company_name', 'company_size', 'projects_posted', 'is_verified', 'payment_verified']
    list_filter = ['client_type', 'company_size', 'is_verified', 'payment_verified', 'created_at']
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'company_name', 'contact_person', 'industry']
    readonly_fields = ['projects_posted', 'projects_completed', 'total_spent', 'created_at']
    
    fieldsets = (
        ('User Information', {
            'fields': ('user',)
        }),
        ('Organization Details', {
            'fields': ('client_type', 'company_name', 'company_size', 'industry')
        }),
        ('Contact Information', {
            'fields': ('contact_person', 'phone_number', 'business_address', 'preferred_communication')
        }),
        ('Business Details', {
            'fields': ('business_registration', 'tax_id'),
            'classes': ('collapse',)
        }),
        ('Project Preferences', {
            'fields': ('typical_budget_range', 'project_types')
        }),
        ('Performance Metrics', {
            'fields': ('projects_posted', 'projects_completed', 'total_spent'),
            'classes': ('collapse',)
        }),
        ('Verification Status', {
            'fields': ('is_verified', 'payment_verified')
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

# Social Media Admin Classes
@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'category', 'is_public', 'like_count', 'comment_count', 'created_at']
    list_filter = ['category', 'is_public', 'allow_comments', 'allow_sharing', 'created_at']
    search_fields = ['title', 'content', 'user__username', 'tags']
    readonly_fields = ['like_count', 'comment_count', 'share_count', 'view_count', 'created_at', 'updated_at']
    raw_id_fields = ['user']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'title', 'content', 'category', 'tags', 'image')
        }),
        ('Privacy Settings', {
            'fields': ('is_public', 'allow_comments', 'allow_sharing'),
        }),
        ('Engagement Metrics', {
            'fields': ('like_count', 'comment_count', 'share_count', 'view_count'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ['user', 'post', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'post__title']
    raw_id_fields = ['user', 'post']
    readonly_fields = ['created_at']

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['user', 'post', 'content_preview', 'parent', 'like_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'post__title', 'content']
    raw_id_fields = ['user', 'post', 'parent']
    readonly_fields = ['like_count', 'created_at', 'updated_at']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content Preview'

@admin.register(CommentLike)
class CommentLikeAdmin(admin.ModelAdmin):
    list_display = ['user', 'comment', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'comment__content']
    raw_id_fields = ['user', 'comment']
    readonly_fields = ['created_at']

# Blog Engagement Admin Classes
@admin.register(BlogLike)
class BlogLikeAdmin(admin.ModelAdmin):
    list_display = ['user', 'blog_post', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'blog_post__title']
    raw_id_fields = ['user', 'blog_post']
    readonly_fields = ['created_at']

@admin.register(BlogComment)
class BlogCommentAdmin(admin.ModelAdmin):
    list_display = ['user', 'blog_post', 'content_preview', 'parent', 'like_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'blog_post__title', 'content']
    raw_id_fields = ['user', 'blog_post', 'parent']
    readonly_fields = ['like_count', 'created_at', 'updated_at']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content Preview'

@admin.register(BlogCommentLike)
class BlogCommentLikeAdmin(admin.ModelAdmin):
    list_display = ['user', 'comment', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'comment__content']
    raw_id_fields = ['user', 'comment']
    readonly_fields = ['created_at']
