# Vikra Hub - Full Stack Application

A modern full-stack web application with Django REST API backend and React frontend.

## Project Structure

```
📁 Vikra Hub Project/
├── backend/               # Django Backend (Port 8000)
│   ├── core/             # Main Django app
│   ├── vikrahub/         # Django project settings
│   ├── manage.py         # Django management script
│   ├── requirements.txt  # Python dependencies
│   ├── db.sqlite3       # SQLite database
│   ├── venv/            # Virtual environment
│   └── README_BACKEND.md # Backend documentation
├── frontend/             # React Frontend (Port 3000/3001)
│   ├── src/             # React source code
│   ├── public/          # Public assets
│   ├── package.json     # Node.js dependencies
│   └── README.md        # Frontend documentation
├── .git/                # Git repository
└── .gitignore          # Git ignore file
```

## Architecture

### 🔧 **Backend (Django REST API)**
- **Framework**: Django 5.2.4 with Django REST Framework
- **Authentication**: JWT tokens via djangorestframework-simplejwt
- **Database**: SQLite (development)
- **CORS**: Configured for React frontend
- **Media Storage**: Cloudinary integration for file uploads

### ⚛️ **Frontend (React SPA)**
- **Framework**: React 19.1.0
- **Routing**: React Router for navigation
- **HTTP Client**: Axios for API communication
- **Authentication**: JWT token management
- **Styling**: CSS assets migrated from Django

## Quick Start

### 1. Start Backend Server
```bash
cd backend
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
Backend will be available at: `http://127.0.0.1:8000/`

### 2. Start Frontend Server
```bash
cd frontend
npm install
npm start
```
Frontend will be available at: `http://localhost:3000/`

## API Endpoints

- `/api/auth/` - Authentication (login, register, token refresh)
- `/api/users/` - User management
- `/api/team/` - Team members
- `/api/services/` - Services
- `/api/portfolio/` - Portfolio items
- `/api/blog/` - Blog posts
- `/api/notifications/` - Notifications

## Features

✅ **Implemented:**
- JWT Authentication system
- Complete REST API with ViewSets
- React frontend with routing
- CORS configuration
- Asset migration from Django to React
- Protected routes
- Admin dashboard
- Database models for all entities

## Development

- **Backend**: Django development server with auto-reload
- **Frontend**: React development server with hot reload
- **Database**: SQLite for development (easily switchable to PostgreSQL)
- **Authentication**: JWT tokens with refresh mechanism
- **API Documentation**: Available through Django REST Framework browsable API

## Production Ready

The application is structured for easy deployment:
- Backend: Ready for WSGI/ASGI deployment
- Frontend: Ready for static hosting or CDN
- Database: Easily configurable for PostgreSQL
- Storage: AWS S3 integration configured
