# Vikra Hub - Django Backend (API Only)

This is the Django backend that serves as a REST API for the React frontend.

<!-- Database Population: Sample data should be created during deployment via build.sh -->

## Structure
```
📁 backend/ (Django Backend - Port 8000)
├── core/                    # Main app with models, views, serializers
├── vikrahub/               # Django project settings
├── manage.py               # Django management script
├── requirements.txt        # Python dependencies
├── db.sqlite3             # SQLite database
└── venv/                  # Virtual environment
```

## Features
- REST API endpoints for all models
- JWT Authentication
- Django Admin interface
- CORS enabled for React frontend
- AWS S3 storage integration

## API Endpoints
- `/api/auth/` - Authentication (login, register, token refresh)
- `/api/users/` - User management
- `/api/team/` - Team members
- `/api/services/` - Services
- `/api/portfolio/` - Portfolio items
- `/api/blog/` - Blog posts
- `/api/notifications/` - Notifications

## Running the Backend
```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start server
python manage.py runserver
```

The backend will be available at: http://127.0.0.1:8000/
Admin interface: http://127.0.0.1:8000/admin/
API endpoints: http://127.0.0.1:8000/api/
