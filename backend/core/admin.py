from django.contrib import admin
from .models import Service, PortfolioItem, BlogPost
from .models import TeamMember
from django.contrib import admin

# Register your models here.
admin.site.register(Service)
admin.site.register(PortfolioItem)
admin.site.register(BlogPost)
admin.site.register(TeamMember)
