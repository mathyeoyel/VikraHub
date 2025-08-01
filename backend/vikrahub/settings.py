import os
from pathlib import Path
import sys
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Environment validation
def validate_environment():
    """Validate required environment variables for production"""
    required_vars = []
    
    # Check if we're in production (not debug mode)
    debug_mode = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    if not debug_mode:
        if not os.environ.get('DJANGO_SECRET_KEY'):
            required_vars.append('DJANGO_SECRET_KEY')
        
        if not os.environ.get('ALLOWED_HOSTS'):
            print("Warning: ALLOWED_HOSTS not set, using defaults")
    
    if required_vars:
        print(f"❌ Missing required environment variables: {', '.join(required_vars)}")
        print("Please set these environment variables before running in production.")
        if not debug_mode:
            sys.exit(1)

# Validate environment on startup
validate_environment()

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'dev-secret-key-change-in-production')

# Warn if using default secret key
if SECRET_KEY == 'dev-secret-key-change-in-production':
    print("⚠️  WARNING: Using default secret key! Set DJANGO_SECRET_KEY environment variable.")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'

# Print debug info
print(f"Django starting with DEBUG={DEBUG}")
print(f"SECRET_KEY configured: {'Yes' if SECRET_KEY else 'No'}")

ALLOWED_HOSTS = [
    # Custom domain
    'vikrahub.com',
    'www.vikrahub.com', 
    'api.vikrahub.com',
    # Render domains
    '.onrender.com', 
    # Local development
    'localhost', 
    '127.0.0.1',
    'testserver'  # For Django testing
]

# Extend ALLOWED_HOSTS with environment variable
env_allowed_hosts = os.environ.get('ALLOWED_HOSTS', '')
if env_allowed_hosts:
    additional_hosts = [host.strip() for host in env_allowed_hosts.split(',') if host.strip()]
    ALLOWED_HOSTS.extend(additional_hosts)
    print(f"🔧 Extended ALLOWED_HOSTS with: {additional_hosts}")

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',  # Required for django-allauth
    'django.contrib.sitemaps',  # For SEO sitemap generation
    'rest_framework',
    'corsheaders',
    'channels',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'core',
    'messaging',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'allauth.account.middleware.AccountMiddleware',  # Required for django-allauth
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'vikrahub.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'vikrahub.wsgi.application'
ASGI_APPLICATION = 'vikrahub.asgi.application'

# Channel Layers Configuration for WebSocket support
import logging

# Set up channel layer logging
channel_logger = logging.getLogger('channels')

# Check for Redis URL
redis_url = os.environ.get('REDIS_URL')
if redis_url:
    print(f"🔗 Using Redis for WebSocket channel layer: {redis_url}")
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {
                "hosts": [redis_url],
                "capacity": 1500,  # Default is 100, increase for production
                "expiry": 60,      # Message expiry in seconds
            },
        },
    }
else:
    if DEBUG:
        print("🔧 Development mode: Using in-memory channel layer (WebSockets limited to single server)")
        CHANNEL_LAYERS = {
            "default": {
                "BACKEND": "channels.layers.InMemoryChannelLayer",
                "CONFIG": {
                    "capacity": 1500,
                    "expiry": 60,
                },
            }
        }
    else:
        print("⚠️  WARNING: No REDIS_URL found in production! WebSockets will not work properly.")
        print("⚠️  Please set REDIS_URL environment variable for production deployment.")
        # Still configure a basic layer to prevent crashes
        CHANNEL_LAYERS = {
            "default": {
                "BACKEND": "channels.layers.InMemoryChannelLayer",
                "CONFIG": {
                    "capacity": 100,
                    "expiry": 60,
                },
            }
        }

# Database
DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL:
    import dj_database_url
    DATABASES = {'default': dj_database_url.config(default=DATABASE_URL)}
    print("Using PostgreSQL database")
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
    print("Using SQLite database")

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# WhiteNoise configuration
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# CORS Configuration - More secure settings
DEBUG_MODE = os.environ.get('DEBUG', 'False').lower() == 'true'

if DEBUG_MODE:
    # Development: Allow all origins
    CORS_ALLOW_ALL_ORIGINS = True
    print("🔧 Development mode: CORS allows all origins")
else:
    # Production: Restrict to specific origins
    CORS_ALLOWED_ORIGINS = [
        # Custom domain
        "https://vikrahub.com",
        "https://www.vikrahub.com",
        # Deployment domains
        "https://vikrahub.netlify.app",
        "https://vikrahub-frontend.onrender.com",
        # Local development
        "http://localhost:3000",
    ]
    
    # Extend CORS_ALLOWED_ORIGINS with environment variable
    env_cors_origins = os.environ.get('CORS_ALLOWED_ORIGINS', '')
    if env_cors_origins:
        additional_origins = [origin.strip() for origin in env_cors_origins.split(',') if origin.strip()]
        CORS_ALLOWED_ORIGINS.extend(additional_origins)
        print(f"🔧 Extended CORS_ALLOWED_ORIGINS with: {additional_origins}")
    
    print(f"🔒 Production mode: CORS restricted to: {CORS_ALLOWED_ORIGINS}")

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
CORS_PREFLIGHT_MAX_AGE = 86400

print("CORS_ALLOW_ALL_ORIGINS = True")
print("CORS configured for all methods and headers")

# Security Headers
if not DEBUG_MODE:
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    
    # Only use HTTPS in production
    if os.environ.get('USE_HTTPS', 'True').lower() == 'true':
        SECURE_SSL_REDIRECT = True
        SESSION_COOKIE_SECURE = True
        CSRF_COOKIE_SECURE = True
    
    # Trust the X-Forwarded-Proto header from Render so Django knows the request is HTTPS
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    
    print("🔒 Security headers configured for production")

# Disable trailing-slash redirects if API endpoints already include a slash
APPEND_SLASH = False

# Session Configuration
SESSION_COOKIE_AGE = 86400  # 24 hours
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'

# CSRF Configuration
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Lax'

# CSRF trusted origins for custom domain
CSRF_TRUSTED_ORIGINS = [
    'https://vikrahub.com',
    'https://www.vikrahub.com',
    'https://api.vikrahub.com',
    'https://vikrahub.netlify.app',
    'https://vikrahub-frontend.onrender.com',
]

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}

# Logging Configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        'core': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        'messaging': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        'core.jwt_auth_middleware': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        'vikrahub.asgi': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Create logs directory if it doesn't exist
logs_dir = BASE_DIR / 'logs'
logs_dir.mkdir(exist_ok=True)

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME = os.environ.get('CLOUDINARY_CLOUD_NAME', '')
CLOUDINARY_API_KEY = os.environ.get('CLOUDINARY_API_KEY', '')
CLOUDINARY_API_SECRET = os.environ.get('CLOUDINARY_API_SECRET', '')

if CLOUDINARY_CLOUD_NAME:
    print(f"Cloudinary configured: {CLOUDINARY_CLOUD_NAME}")
else:
    print("Cloudinary not configured - file uploads disabled")

print("Django settings loaded successfully!")

# Site ID for django-allauth
SITE_ID = 1

# Authentication backends
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

# Django-allauth configuration (updated to newer format)
ACCOUNT_EMAIL_VERIFICATION = 'none'  # Disable email verification for now
ACCOUNT_LOGIN_METHODS = {'email'}  # Use email for login instead of username
ACCOUNT_SIGNUP_FIELDS = ['email*', 'password1*', 'password2*']  # Email and password required
ACCOUNT_UNIQUE_EMAIL = True
LOGIN_REDIRECT_URL = '/'
LOGOUT_REDIRECT_URL = '/'

# Social account providers
SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': [
            'profile',
            'email',
        ],
        'AUTH_PARAMS': {
            'access_type': 'online',
        },
        'OAUTH_PKCE_ENABLED': True,
    }
}

# Google OAuth2 credentials from environment variables
GOOGLE_OAUTH2_CLIENT_ID = os.environ.get('GOOGLE_OAUTH2_CLIENT_ID', '')
GOOGLE_OAUTH2_CLIENT_SECRET = os.environ.get('GOOGLE_OAUTH2_CLIENT_SECRET', '')

if GOOGLE_OAUTH2_CLIENT_ID and GOOGLE_OAUTH2_CLIENT_SECRET:
    print("✅ Google OAuth2 credentials configured")
else:
    print("⚠️  Google OAuth2 credentials not found. Set GOOGLE_OAUTH2_CLIENT_ID and GOOGLE_OAUTH2_CLIENT_SECRET environment variables.")