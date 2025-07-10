import dj_database_url
import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent

# Database
# Use DATABASE_URL if set, otherwise use local SQLite for dev
DATABASES = {}

DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL:
    import dj_database_url
    DATABASES['default'] = dj_database_url.config(default=DATABASE_URL)
else:
    DATABASES['default'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
# Static files (CSS, JavaScript, Images)
# Use Whitenoise for serving static files in production
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# ─── SECURITY ──────────────────────────────────────────────────────────────────
# This is a minimal settings file for a Django project, suitable for deployment on Render.
import os
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')
DEBUG = True
ALLOWED_HOSTS = ['vikrahub.onrender.com', '.onrender.com', 'localhost', '127.0.0.1']


INSTALLED_APPS = [
    # built-ins
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',  # ← must be here
    # third-party
    'whitenoise.runserver_nostatic',  # for local development with Whiten
    'storages',  # for AWS S3 storage
    # local apps
    'core',
]

MIDDLEWARE = [
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'vikrahub.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [ BASE_DIR / 'templates' ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'django.template.context_processors.static',
            ],
        },
    },
]

WSGI_APPLICATION = 'vikrahub.wsgi.application'
# ─── AUTHENTICATION ────────────────────────────────────────────────────────────
AUTH_USER_MODEL = 'auth.User'  # Use Django's built-in User model

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True

# ─── STATIC FILES ──────────────────────────────────────────────────────────────
STATIC_URL = '/static/'

# DEV: Look for everything under <project_root>/static/
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# PROD: collectstatic will gather here
STATIC_ROOT = BASE_DIR / 'staticfiles'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


LOGIN_REDIRECT_URL = '/profile/'
LOGOUT_REDIRECT_URL = '/logout-success/'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# ---- AWS S3 MEDIA STORAGE ----
INSTALLED_APPS += ['storages']

AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME')
AWS_S3_REGION_NAME = os.environ.get('AWS_S3_REGION_NAME')
AWS_S3_CUSTOM_DOMAIN = f"{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com"

DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
MEDIA_URL = f"https://{AWS_S3_CUSTOM_DOMAIN}/"

AWS_DEFAULT_ACL = 'public-read'
AWS_QUERYSTRING_AUTH = False
# ---- END AWS S3 MEDIA STORAGE ----