from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model, login, authenticate
from django.contrib.auth.forms import UserChangeForm
from .forms import CustomUserCreationForm, UserProfileForm
from .models import Service, PortfolioItem, BlogPost, TeamMember, UserProfile

User = get_user_model()

# --- User Profile Views ---

@login_required
def profile(request):
    profile = getattr(request.user, 'profile', None)
    if profile is None:
        profile = UserProfile.objects.create(user=request.user)
    return render(request, 'profile.html')

@login_required
def edit_profile(request):
    profile = getattr(request.user, 'profile', None)
    if profile is None:
        profile = UserProfile.objects.create(user=request.user)
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
    return render(request, 'dashboard.html')

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
