from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import UserChangeForm
from django.contrib.auth.models import User
from .models import Service, PortfolioItem, BlogPost, TeamMember, UserProfile, Notification
from django.db.models import Count
from django.db.models.functions import TruncMonth
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.views import APIView
from .models import TeamMember
from .serializers import TeamMemberSerializer
import calendar
from .forms import (
    CustomUserCreationForm, UserProfileForm,
    TeamMemberForm, ServiceForm, PortfolioItemForm, BlogPostForm
)

class TeamMemberViewSet(viewsets.ModelViewSet):
    queryset = TeamMember.objects.all()
    serializer_class = TeamMemberSerializer

# --- User Profile Views ---
class ProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    permission_classes = [IsAuthenticated]
    authentication_classes = [SessionAuthentication, BasicAuthentication]
    serializer_class = TeamMemberSerializer
    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

@login_required
def profile(request):
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    return render(request, 'profile.html')

@login_required
def edit_profile(request):
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    user_form = UserChangeForm(request.POST or None, instance=request.user)
    profile_form = UserProfileForm(request.POST or None, request.FILES or None, instance=profile)

    if request.method == 'POST':
        if user_form.is_valid() and profile_form.is_valid():
            user_form.save()
            profile_form.save()
            return redirect('profile')

    return render(request, 'edit_profile.html', {
        'user_form': user_form,
        'profile_form': profile_form,
    })

# --- Registration View ---

def register(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('login')
    else:
        form = CustomUserCreationForm()
    return render(request, 'registration/register.html', {'form': form})

@login_required
def dashboard(request):
    
    # Get or create profile
    profile, _ = UserProfile.objects.get_or_create(user=request.user)

    # Profile completeness
    fields = [profile.avatar, profile.bio, profile.website, profile.twitter, profile.instagram, profile.facebook]
    filled_fields = [f for f in fields if f]
    profile_percent = int((len(filled_fields) / len(fields)) * 100) if fields else 100


    # Recent blog posts (last 3, by this user, if BlogPost.user exists)
    try:
        recent_posts = BlogPost.objects.filter(user=request.user).order_by('-created_at')[:3]
        post_count = BlogPost.objects.filter(user=request.user).count()
    except Exception:
        recent_posts = BlogPost.objects.filter(published=True).order_by('-created_at')[:3]  # fallback: all posts
        post_count = BlogPost.objects.filter(published=True).count()

    # Recent portfolio items (last 3, if you link PortfolioItem to user)
    try:
        recent_portfolios = PortfolioItem.objects.filter(user=request.user).order_by('-date')[:3]
        portfolio_count = PortfolioItem.objects.filter(user=request.user).count()
    except Exception:
        recent_portfolios = PortfolioItem.objects.all().order_by('-date')[:3]
        portfolio_count = PortfolioItem.objects.count()

    # Example notifications (static for now, make dynamic as you wish)
    notifications = [
        {"message": "Welcome to your dashboard!", "type": "info"},
        {"message": "You have new messages.", "type": "alert"}, 
    ]
    if request.user.is_authenticated:
        # Fetch notifications from the database
        notifications = Notification.objects.filter(user=request.user, is_read=False).order_by('-created_at')[:5]
    else:
        notifications = [
            {"message": "Please log in to see your notifications.", "type": "info"},
            {"message": "You can update your profile in the settings.", "type": "info"},
            {"message": "You can create blog posts and portfolio items.", "type": "info"},
        ]
        

    context = {
        "profile": profile,
        "profile_percent": profile_percent,
        "post_count": post_count,
        "portfolio_count": portfolio_count,
        "recent_posts": recent_posts,
        "recent_portfolios": recent_portfolios,
        "notifications": notifications,
        "todo": [],  # Placeholder for todo list, can be dynamic
    }

    # --- Blog Posts per Month for Chart ---
    blog_qs = BlogPost.objects.all()  # Or filter(user=request.user) if your model supports it
    monthly_posts = (
        blog_qs.annotate(month=TruncMonth('created_at'))
        .values('month')
        .annotate(count=Count('id'))
        .order_by('month')
    )

    # Prepare chart data for template
    chart_labels = [calendar.month_abbr[item['month'].month] + ' ' + str(item['month'].year) for item in monthly_posts]
    chart_data = [item['count'] for item in monthly_posts]

    skills_list = []
    if profile.skills:
        skills_list = [s.strip() for s in profile.skills.split(',') if s.strip()]
    # Prepare skills list

    context = {
        # ... existing context ...
        "chart_labels": chart_labels,
        "chart_data": chart_data,
        "profile": profile,
        "skills_list": skills_list,
        "profile_percent": profile_percent,
        "recent_posts": recent_posts,
        "recent_portfolios": recent_portfolios,
        "notifications": notifications,
    }
    # Render the dashboard template with the context
    return render(request, "dashboard.html", context)
        

# --- Content Views ---

def home(request):
    services = Service.objects.all()
    portfolios = PortfolioItem.objects.all()[:6]  # Show 6 latest
    posts = BlogPost.objects.filter(published=True).order_by('-created_at')[:3]
    return render(request, 'home.html', {
        'services': services,
        'portfolios': portfolios,
        'posts': posts,
    })

def post_project(request):
    # Your view logic here
    return render(request, 'post_project.html')

def browse_designers(request):
    # Your view logic here
    return render(request, 'browse_designers.html')


def portfolio_detail(request, id):
    item = get_object_or_404(PortfolioItem, pk=id)
    return render(request, 'portfolio_detail.html', {'item': item})

def service_detail(request, slug):
    service = get_object_or_404(Service, slug=slug)
    return render(request, 'service_detail.html', {'service': service})

def starter(request):
    return render(request, 'starter.html')

def about(request):
    return render(request, 'about.html')

def blog_detail(request, slug):
    post = get_object_or_404(BlogPost, slug=slug, published=True)
    return render(request, 'blog_detail.html', {'post': post})

def team(request):
    team_members = TeamMember.objects.all()
    return render(request, 'team.html', {'team_members': team_members})


@login_required
def add_team_member(request):
    if request.method == 'POST':
        form = TeamMemberForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return redirect('team')
    else:
        form = TeamMemberForm()
    return render(request, 'add_team_member.html', {'form': form})

@login_required
def add_service(request):
    if request.method == 'POST':
        form = ServiceForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return redirect('home')
    else:
        form = ServiceForm()
    return render(request, 'add_service.html', {'form': form})

@login_required
def add_portfolio(request):
    if request.method == 'POST':
        form = PortfolioItemForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return redirect('home')
    else:
        form = PortfolioItemForm()
    return render(request, 'add_portfolio.html', {'form': form})

@login_required
def add_blog(request):
    if request.method == 'POST':
        form = BlogPostForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return redirect('home')
    else:
        form = BlogPostForm()
    return render(request, 'add_blog.html', {'form': form})
# --- End of Views ---
# vikrahub/core/views.py