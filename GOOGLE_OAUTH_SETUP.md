# Google OAuth2 Setup Guide for VikraHub

This guide will help you set up Google OAuth2 authentication for VikraHub.

## Prerequisites

1. Google Cloud Console account
2. VikraHub project running locally or deployed

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your project ID

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API" and enable it
3. Also enable "Google Identity Services API"

## Step 3: Create OAuth2 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure the consent screen if prompted:
   - User Type: External (for testing) or Internal (for organization)
   - App name: VikraHub
   - User support email: Your email
   - App domain: Your domain (e.g., vikrahub.com)
   - Developer contact: Your email

4. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Name: VikraHub Web Client
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/auth/google/callback/` (for development)
     - `https://yourdomain.com/auth/google/callback/` (for production)

5. Copy the Client ID and Client Secret

## Step 4: Configure Environment Variables

### For Development:
Create a `.env` file in the backend directory:

```bash
# Google OAuth2 Configuration
GOOGLE_OAUTH2_CLIENT_ID=your_client_id_here
GOOGLE_OAUTH2_CLIENT_SECRET=your_client_secret_here
```

### For Production:
Set the environment variables in your hosting platform:

```bash
GOOGLE_OAUTH2_CLIENT_ID=your_client_id_here
GOOGLE_OAUTH2_CLIENT_SECRET=your_client_secret_here
```

## Step 5: Update Authorized Domains

1. In Google Cloud Console, go to "APIs & Services" > "OAuth consent screen"
2. Add your domains to "Authorized domains":
   - `localhost` (for development)
   - `yourdomain.com` (for production)

## Step 6: Test the Integration

1. Start your Django backend: `python manage.py runserver`
2. Start your React frontend: `npm start`
3. Go to http://localhost:3000
4. Try signing in with Google

## Step 7: Production Configuration

For production deployment:

1. Update authorized origins and redirect URIs in Google Cloud Console
2. Set environment variables in your hosting platform (Render, Heroku, etc.)
3. Ensure HTTPS is enabled (required for production OAuth)

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch" error**
   - Check that your redirect URIs in Google Cloud Console match exactly
   - Include the trailing slash: `/auth/google/callback/`

2. **"origin_mismatch" error**
   - Verify JavaScript origins are correctly configured
   - Don't include paths, only the domain

3. **Google Sign-In button not appearing**
   - Check browser console for JavaScript errors
   - Verify the Google Identity Services script is loaded
   - Ensure GOOGLE_OAUTH2_CLIENT_ID is set

4. **Backend authentication fails**
   - Check that GOOGLE_OAUTH2_CLIENT_SECRET is set
   - Verify the token is being sent correctly from frontend

### Testing Endpoints:

- Backend config: `http://localhost:8000/api/auth/google/config/`
- Backend auth: `http://localhost:8000/api/auth/google/` (POST)

## Security Notes

1. Never commit Google OAuth credentials to version control
2. Use different credentials for development and production
3. Regularly rotate your client secret
4. Monitor OAuth usage in Google Cloud Console

## Features Enabled

✅ Sign up with Google  
✅ Sign in with Google  
✅ Automatic user profile creation  
✅ JWT token generation  
✅ Profile picture from Google  
✅ Email verification bypass  

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check Django logs for backend errors  
3. Verify all environment variables are set
4. Test with a fresh Google account

For more help, refer to:
- [Google Identity Documentation](https://developers.google.com/identity)
- [Django-allauth Documentation](https://django-allauth.readthedocs.io/)
