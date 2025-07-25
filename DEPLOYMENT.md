# VikraHub Deployment Guide - Render Platform

This guide covers deploying VikraHub to Render with full WebSocket and messaging support.

## Overview

VikraHub requires:
- **Backend**: Django with ASGI for WebSocket support
- **Frontend**: React static site with environment variables
- **Database**: PostgreSQL
- **Cache/Message Broker**: Redis for WebSocket channel layers

---

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: VikraHub code pushed to GitHub
3. **Domain** (optional): Custom domain configured

---

## Step 1: Provision Redis Instance

### 1.1 Create Redis Service
1. Go to Render Dashboard → "New" → "Redis"
2. Configure:
   - **Name**: `vikrahub-redis`
   - **Plan**: Free (or paid for production)
   - **Region**: Same as your web services
3. Click "Create Redis Instance"
4. **Save the Redis URL** - you'll need it for environment variables

### 1.2 Get Redis Connection String
- Format: `redis://red-xxxxxxxxxxxx:6379`
- Found in Redis instance dashboard under "Info"

---

## Step 2: Deploy Backend (Django + ASGI)

### 2.1 Create Web Service
1. Render Dashboard → "New" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `vikrahub-backend`
   - **Runtime**: Python 3
   - **Build Command**:
     ```bash
     cd backend
     pip install -r requirements.txt
     python manage.py collectstatic --no-input
     python manage.py migrate
     ```
   - **Start Command**:
     ```bash
     cd backend && daphne vikrahub.asgi:application --bind 0.0.0.0 --port $PORT
     ```

### 2.2 Configure Environment Variables
Set these in the backend service environment:

| Variable | Value | Description |
|----------|-------|-------------|
| `DJANGO_SECRET_KEY` | *auto-generated* | Django secret key |
| `DEBUG` | `False` | Production mode |
| `DATABASE_URL` | *auto-populated* | PostgreSQL connection |
| `REDIS_URL` | `redis://red-xxx:6379` | Redis connection from Step 1 |
| `ALLOWED_HOSTS` | `api.vikrahub.com,vikrahub.com,.onrender.com` | Allowed domains |
| `CORS_ALLOWED_ORIGINS` | `https://vikrahub.com,https://www.vikrahub.com` | CORS domains |
| `CLOUDINARY_CLOUD_NAME` | `dxpwtdjzp` | Media storage |
| `CLOUDINARY_API_KEY` | `415637895317185` | Media storage |
| `CLOUDINARY_API_SECRET` | `iRP8rC2Onej0vjV6TVwnmMw_zDA` | Media storage |

### 2.3 Connect Database
1. Create PostgreSQL database: "New" → "PostgreSQL"
2. Name: `vikrahub-db`
3. The `DATABASE_URL` will be auto-populated

---

## Step 3: Deploy Frontend (React Static)

### 3.1 Create Static Site
1. Render Dashboard → "New" → "Static Site"
2. Connect same GitHub repository
3. Configure:
   - **Name**: `vikrahub-frontend`
   - **Build Command**:
     ```bash
     cd frontend
     npm ci
     npm run build
     ```
   - **Publish Directory**: `frontend/build`

### 3.2 Configure Frontend Environment Variables
Set these in the frontend service environment:

| Variable | Value | Description |
|----------|-------|-------------|
| `REACT_APP_API_URL` | `https://api.vikrahub.com/api/` | Backend API URL |
| `REACT_APP_WS_URL` | `wss://api.vikrahub.com/ws/` | WebSocket URL |
| `REACT_APP_CLOUDINARY_CLOUD_NAME` | `dxpwtdjzp` | Media uploads |
| `REACT_APP_CLOUDINARY_API_KEY` | `415637895317185` | Media uploads |

---

## Step 4: Configure Custom Domains

### 4.1 Backend Domain
1. Backend service → "Settings" → "Custom Domains"
2. Add: `api.vikrahub.com`
3. Configure DNS with your domain provider:
   ```
   Type: CNAME
   Name: api
   Value: vikrahub-backend.onrender.com
   ```

### 4.2 Frontend Domain
1. Frontend service → "Settings" → "Custom Domains"
2. Add: `vikrahub.com` and `www.vikrahub.com`
3. Configure DNS:
   ```
   Type: CNAME
   Name: @
   Value: vikrahub-frontend.onrender.com
   
   Type: CNAME  
   Name: www
   Value: vikrahub-frontend.onrender.com
   ```

---

## Step 5: Verification

### 5.1 Backend Health Check
1. Visit: `https://api.vikrahub.com/api/`
2. Should return JSON with API info
3. Check: `https://api.vikrahub.com/admin/` (Django admin)

### 5.2 Frontend Verification
1. Visit: `https://vikrahub.com`
2. Check browser console for:
   - No API connection errors
   - Correct API URL in network requests
   - WebSocket connections

### 5.3 WebSocket Functionality Test
1. Open browser DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Login to the application
4. Look for WebSocket connection to: `wss://api.vikrahub.com/ws/messaging/`
5. Status should be "101 Switching Protocols" (success)

### 5.4 Follow System Test
1. Login to VikraHub
2. Go to any user profile  
3. Click "Follow" button
4. Should see success message, no console errors
5. Network tab should show POST to `/api/follow/follow/`

---

## Troubleshooting

### WebSocket Connection Issues
- **Error**: Connection refused
- **Check**: REDIS_URL is correctly set
- **Check**: Backend using ASGI (daphne) not WSGI (gunicorn)
- **Fix**: Ensure start command uses `daphne vikrahub.asgi:application`

### CORS Errors
- **Error**: Access-Control-Allow-Origin
- **Check**: CORS_ALLOWED_ORIGINS includes frontend domain
- **Fix**: Add `https://vikrahub.com` to CORS_ALLOWED_ORIGINS

### Follow Button Not Working
- **Error**: "follow is not a function"
- **Check**: Frontend built with latest code
- **Check**: REACT_APP_API_URL points to correct backend
- **Fix**: Trigger frontend rebuild

### Environment Variables Not Applied
- **Issue**: Changes not reflected
- **Fix**: Redeploy services after changing environment variables
- **Check**: Build logs for environment variable values

---

## Production Checklist

- [ ] Backend deployed with ASGI
- [ ] Redis instance created and connected
- [ ] PostgreSQL database connected
- [ ] Frontend built with correct API URLs
- [ ] Custom domains configured
- [ ] SSL certificates active
- [ ] WebSocket connections working
- [ ] Follow system functional
- [ ] Media uploads working (Cloudinary)
- [ ] Admin panel accessible

---

## Using render.yaml (Automated)

For automated deployment, use the provided `render.yaml`:

```yaml
# Place in repository root
services:
  - type: web
    name: vikrahub-backend
    runtime: python3
    buildCommand: |
      cd backend
      pip install -r requirements.txt
      python manage.py collectstatic --no-input
      python manage.py migrate
    startCommand: cd backend && daphne vikrahub.asgi:application --bind 0.0.0.0 --port $PORT
    # ... environment variables

  - type: static  
    name: vikrahub-frontend
    buildCommand: |
      cd frontend
      npm ci
      npm run build
    staticPublishPath: frontend/build
    # ... environment variables
```

Deploy with:
1. Commit `render.yaml` to repository root
2. Render will auto-detect and deploy both services
3. Still need to manually create Redis and configure domains

---

## Support

For deployment issues:
1. Check Render service logs
2. Verify environment variables
3. Test API endpoints individually
4. Check WebSocket connections in browser DevTools

The VikraHub application should be fully functional with messaging, follow system, and real-time notifications after following this guide.
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
