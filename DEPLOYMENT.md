# VikraHub Render Deployment Guide

This guide will help you deploy your VikraHub application on Render.

## Prerequisites

1. **GitHub Repository**: Make sure your code is pushed to GitHub
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Cloudinary Account**: For file/image uploads (optional but recommended)

## Deployment Steps

### Step 1: Deploy Django Backend

1. **Create Web Service on Render**:
   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your repository

2. **Configure Backend Service**:
   ```
   Name: vikrahub-backend (or your preferred name)
   Runtime: Python 3
   Build Command: ./build.sh
   Start Command: gunicorn vikrahub.wsgi:application
   ```

3. **Set Environment Variables**:
   - `DJANGO_SECRET_KEY`: Generate a secure secret key
   - `DEBUG`: `False`
   - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
   - `CLOUDINARY_API_KEY`: Your Cloudinary API key  
   - `CLOUDINARY_API_SECRET`: Your Cloudinary API secret

4. **Add PostgreSQL Database**:
   - In your service dashboard, go to "Environment"
   - Render will automatically provide `DATABASE_URL`

### Step 2: Deploy React Frontend

1. **Create Static Site on Render**:
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - Select your repository

2. **Configure Frontend Service**:
   ```
   Name: vikrahub-frontend (or your preferred name)
   Build Command: cd frontend && npm install && npm run build
   Publish Directory: frontend/build
   ```

3. **Set Environment Variables**:
   - `REACT_APP_API_URL`: Your backend URL (e.g., `https://vikrahub-backend.onrender.com/api/`)
   - `REACT_APP_CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
   - `REACT_APP_CLOUDINARY_API_KEY`: Your Cloudinary API key

### Step 3: Update CORS Settings

After getting your frontend URL:

1. Update `backend/vikrahub/settings.py`:
   ```python
   CORS_ALLOWED_ORIGINS = [
       "https://your-frontend-app.onrender.com",  # Add your actual frontend URL
       "http://localhost:3000",  # Keep for local development
   ]
   ```

2. Redeploy the backend service

### Step 4: Database Migration

After first deployment:
- Your Django migrations should run automatically via the build script
- Check the service logs to ensure migrations completed successfully

## Important Notes

1. **Free Tier Limitations**:
   - Services may sleep after 15 minutes of inactivity
   - First request after sleeping may take 30+ seconds

2. **Static Files**:
   - Handled by WhiteNoise in Django settings
   - No additional configuration needed

3. **File Uploads**:
   - Configure Cloudinary for production file storage
   - Local media files won't persist on Render

4. **Environment Variables**:
   - Never commit real environment variables to Git
   - Use Render's environment variable settings

## Troubleshooting

1. **Build Failures**: Check build logs in Render dashboard
2. **API Connection Issues**: Verify CORS settings and API URL
3. **Database Issues**: Ensure DATABASE_URL is properly set
4. **Static Files**: Check WhiteNoise configuration in settings.py

## Production URLs

After deployment, you'll get:
- Backend: `https://your-backend-name.onrender.com`
- Frontend: `https://your-frontend-name.onrender.com`

Update your environment variables accordingly!
