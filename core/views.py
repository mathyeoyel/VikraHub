from django.shortcuts import render, get_object_or_404
from .models import Service, PortfolioItem, BlogPost
from django.shortcuts import render, redirect
from .forms import CustomUserCreationForm
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from .models import TeamMember
from .forms import UserForm, UserProfileForm
from .models import UserProfile
from django.contrib.auth.forms import UserChangeForm
from .forms import UserProfileForm
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login, authenticate
from django.contrib.auth import get_user_model
User = get_user_model()
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import UserChangeForm
from .models import UserProfile
from .forms import UserProfileForm, CustomUserCreationForm

@login_required
def edit_profile(request):
    user_form = UserChangeForm(request.POST or None, instance=request.user)
    profile_form = UserProfileForm(
        request.POST or None,
        request.FILES or None,
        instance=request.user.profile
    )

    if request.method == 'POST':
        if user_form.is_valid() and profile_form.is_valid():
            user_form.save()
            profile_form.save()
            return redirect('profile')

    return render(request, 'edit_profile.html', {
        'user_form': user_form,
        'profile_form': profile_form,
    })


def register(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('login')  # or wherever you want
    else:
        form = CustomUserCreationForm()
    return render(request, 'registration/register.html', {'form': form})

@login_required
def dashboard(request):
    return render(request, 'dashboard.html')


@login_required
def profile(request):
    return render(request, 'profile.html')

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

def service_detail(request, slug):
    service = get_object_or_404(Service, slug=slug)
    return render(request, 'service_detail.html', {'service': service})

def portfolio_detail(request, id):
    item = get_object_or_404(PortfolioItem, pk=id)
    return render(request, 'portfolio_detail.html', {'item': item})

def blog_detail(request, slug):
    post = get_object_or_404(BlogPost, slug=slug, published=True)
    return render(request, 'blog_detail.html', {'post': post})

def team(request):
    team_members = TeamMember.objects.all()
    return render(request, 'team.html', {'team_members': team_members})