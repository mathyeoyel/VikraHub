from django.shortcuts import render, get_object_or_404
from .models import Service, PortfolioItem, BlogPost
from django.shortcuts import render, redirect
from .forms import CustomUserCreationForm
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from .models import TeamMember

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