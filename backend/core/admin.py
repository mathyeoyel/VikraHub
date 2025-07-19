from django.contrib import admin
from .models import Service, PortfolioItem, BlogPost
from .models import TeamMember, AssetCategory, CreativeAsset
from django.contrib import admin

# Register your models here.
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
