from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import UserChangeForm
from .forms import CustomUserCreationForm, UserProfileForm
from .models import Service, PortfolioItem, BlogPost, TeamMember, UserProfile

# --- User Profile Views ---

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
        {"icon": "bi-person-check", "msg": "Welcome to your dashboard!"},
        {"icon": "bi-bell", "msg": "Don't forget to complete your profile."},
        # Add more or fetch from DB
    ]

    context = {
        "profile": profile,
        "profile_percent": profile_percent,
        "post_count": post_count,
        "portfolio_count": portfolio_count,
        "recent_posts": recent_posts,
        "recent_portfolios": recent_portfolios,
        "notifications": notifications,
    }
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
