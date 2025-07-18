# VikraHub Migration Checklist

## ✅ What's Already Prepared

- [x] Django backend restructured in `/backend` folder
- [x] React frontend restructured in `/frontend` folder  
- [x] Build script (`backend/build.sh`) created
- [x] Production-ready Django settings
- [x] CORS configuration for React frontend
- [x] Dynamic API URL in React app
- [x] Environment variable templates

## 🎯 Your Next Steps

### 1. Update Your Existing Render Service

**Go to your existing Django service on Render and update:**

**Build Command:**
```
cd backend && chmod +x build.sh && ./build.sh
```

**Start Command:**
```
cd backend && gunicorn vikrahub.wsgi:application
```

### 2. Push Code Changes
```bash
git add .
git commit -m "Restructure for backend/frontend separation"
git push origin main
```

### 3. Test Backend Deployment
- Your existing service will redeploy automatically
- Check logs for any errors
- Test API endpoints: `https://your-backend-url.onrender.com/api/`

### 4. Create React Frontend Service

**Create new Static Site on Render:**
- Name: `vikrahub-frontend`
- Build Command: `cd frontend && npm install && npm run build`
- Publish Directory: `frontend/build`

**Environment Variables:**
```
REACT_APP_API_URL=https://YOUR-BACKEND-URL.onrender.com/api/
```

### 5. Update CORS Settings

After getting your frontend URL, update `backend/vikrahub/settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    "https://your-frontend-url.onrender.com",
    "http://localhost:3000",  # Keep for development
]
```

## 🚨 Important Notes

1. **Your database will remain intact** - no data loss
2. **Keep your existing environment variables** (DATABASE_URL, DJANGO_SECRET_KEY, etc.)
3. **Test locally first** to ensure everything works
4. **Frontend and backend will have different URLs** after deployment

## 🔧 Local Testing Before Deployment

Run this in your project root:
```bash
# Test backend
cd backend
python manage.py check --deploy
python manage.py collectstatic --dry-run --no-input

# Test frontend  
cd ../frontend
npm install
npm run build
```

✅ **Frontend build tested successfully!** - Ready for Render deployment.

## 📞 Need Help?

If you encounter issues:
1. Check Render service logs
2. Verify file paths in commands
3. Ensure all files are committed to Git
4. Test API endpoints manually

Your restructured project is ready for deployment! 🚀
