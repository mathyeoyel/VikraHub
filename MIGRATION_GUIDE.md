# Migration Guide: From Monolithic Django to Django + React

## Current Situation
You have an existing Django project deployed on Render that now needs to be split into:
- Django Backend (API only)
- React Frontend (separate service)

## Migration Strategy

### Option 1: Update Existing Service + Add Frontend (RECOMMENDED)

This preserves your database and existing data.

#### Step A: Update Your Existing Django Service

1. **Go to your existing Render service dashboard**
2. **Update Build & Start Commands**:
   ```
   Build Command: cd backend && chmod +x build.sh && ./build.sh
   Start Command: cd backend && gunicorn vikrahub.wsgi:application
   ```

3. **Update Environment Variables** (if needed):
   - Your existing `DATABASE_URL` should remain the same
   - Add `DEBUG=False` if not already set
   - Keep your existing `DJANGO_SECRET_KEY`

4. **Deploy the updated backend**:
   - Push your code changes to GitHub
   - Your existing service will redeploy automatically

#### Step B: Create New React Frontend Service

1. **Create a new Static Site on Render**:
   - Go to Render Dashboard
   - Click "New +" → "Static Site"
   - Connect the same GitHub repository

2. **Configure the Frontend**:
   ```
   Name: vikrahub-frontend
   Build Command: cd frontend && npm install && npm run build
   Publish Directory: frontend/build
   ```

3. **Set Environment Variables**:
   ```
   REACT_APP_API_URL=https://YOUR-EXISTING-BACKEND-URL.onrender.com/api/
   ```
   (Replace with your actual backend URL)

#### Step C: Update CORS Settings

1. **Get your new frontend URL** from Render (e.g., `https://vikrahub-frontend.onrender.com`)

2. **Update backend settings.py** and redeploy:
   ```python
   CORS_ALLOWED_ORIGINS = [
       "https://vikrahub-frontend.onrender.com",  # Your new frontend URL
       "http://localhost:3000",  # Keep for local development
   ]
   ```

### Option 2: Fresh Deployment (if you want clean separation)

Create two completely new services and migrate your database.

## Quick Commands for Existing Service Update

### 1. Update your build script permissions:
```bash
# In your repository root:
git add .
git commit -m "Restructure for backend/frontend separation"
git push origin main
```

### 2. Your existing service should now use these paths:
- **Build Command**: `cd backend && chmod +x build.sh && ./build.sh`
- **Start Command**: `cd backend && gunicorn vikrahub.wsgi:application`

### 3. Test your backend API:
Once deployed, test: `https://your-backend-url.onrender.com/api/`

## Important Notes

1. **Database**: Your existing PostgreSQL database will remain untouched
2. **Static Files**: Already configured with WhiteNoise
3. **Media Files**: Consider setting up Cloudinary for file uploads
4. **Environment Variables**: Your existing variables should work

## Troubleshooting

- **Build fails**: Check that `backend/build.sh` is executable
- **Import errors**: Ensure all paths are correct in the new structure
- **CORS errors**: Update CORS_ALLOWED_ORIGINS with frontend URL
- **API not found**: Verify the API URL in React frontend

## Next Steps After Migration

1. Test both services work independently
2. Update any hardcoded URLs in your React app
3. Set up proper environment variables for production
4. Consider setting up Cloudinary for file uploads
