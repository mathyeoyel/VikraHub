# Production Deployment Setup for VikraHub

## Required Environment Variables for Render

Add these environment variables in your Render service dashboard:

### Django Superuser Configuration
```
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@vikrahub.com  
DJANGO_SUPERUSER_PASSWORD=VikraHub2025Admin!
```

### Existing Environment Variables (Keep these)
```
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=False
DATABASE_URL=your-database-url
CLOUDINARY_CLOUD_NAME=dxpwtdjzp
CLOUDINARY_API_KEY=415637895317185
CLOUDINARY_API_SECRET=iRP8rC2Onej0vjV6TVwnmMw_zDA
USE_HTTPS=True
```

## Admin Access After Deployment

Once deployed, you can access the admin interface at:
- **URL**: `https://your-app-name.onrender.com/admin/`
- **Username**: `admin`
- **Password**: `VikraHub2025Admin!`

## How to Set Environment Variables in Render

1. Go to your Render dashboard
2. Select your VikraHub service
3. Go to "Environment" tab
4. Add the new environment variables listed above
5. Save changes
6. Render will automatically redeploy with the new variables

## Deployment Process

The build script (`build.sh`) will automatically:
1. Install dependencies
2. Run migrations
3. Create sample data (6 freelancer accounts)
4. Create production superuser
5. Collect static files

## After Deployment

1. Visit your admin URL
2. Login with the admin credentials
3. You should see all 6 freelancer accounts
4. All admin features will be available

## Troubleshooting

If admin login still fails:
1. Check Render logs for any errors during superuser creation
2. Verify environment variables are set correctly
3. Try manual superuser creation via Render shell (if available)

## Security Note

The superuser password is strong and production-ready. Change it after first login if needed through the Django admin interface.
