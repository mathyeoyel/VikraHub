# Vikra Hub - React Frontend

This is the React frontend that consumes the Django REST API.

## Structure
```
📁 backend/ (Django Backend - Port 8000)
├── core/                   # Django app with models, API views, serializers
├── vikrahub/              # Django project settings
├── manage.py              # Django management script
├── requirements.txt       # Python dependencies
├── db.sqlite3            # SQLite database
└── venv/                 # Virtual environment

📁 frontend/ (React Frontend - Port 3000)
├── src/
│   ├── components/         # UI components
│   │   ├── Dashboard.js    # Admin dashboard
│   │   ├── Services.js     # Services display
│   │   ├── Portfolio.js    # Portfolio showcase
│   │   └── Blog.js         # Blog posts
│   ├── assets/            # Static assets migrated from Django
│   │   ├── css/           # Stylesheets
│   │   ├── img/           # Images
│   │   ├── js/            # JavaScript files
│   │   └── vendor/        # Third-party libraries
│   ├── api.js             # API integration layer
│   ├── auth.js            # Authentication helpers
│   ├── App.js             # Main app with routing
│   ├── Home.js            # Homepage component
│   ├── Team.js            # Team page component
│   ├── Login.js           # Login component
│   └── index.js           # React entry point
├── public/                # Public assets
└── package.json           # Node.js dependencies
```

## Features
- Complete user interface
- JWT authentication with Django backend
- React Router for navigation
- API integration with axios
- Responsive design
- Asset management

## Routes
- `/` - Homepage
- `/team` - Team members page
- `/services` - Services page
- `/portfolio` - Portfolio showcase
- `/blog` - Blog posts
- `/login` - Login page
- `/dashboard` - Admin dashboard (protected)

## Running the Frontend
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

The frontend will be available at: http://localhost:3000/

## API Integration
The frontend communicates with the Django backend at `http://127.0.0.1:8000/api/` through the `api.js` module which provides:
- Authentication API
- User management API
- Team API
- Services API
- Portfolio API
- Blog API
- Notifications API

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
