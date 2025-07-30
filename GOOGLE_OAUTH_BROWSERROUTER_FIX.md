# Google OAuth BrowserRouter Fix - Debugging Guide

## Issue Resolved ✅
Fixed the Google Sign-In component to use the proper API base URL instead of relative URLs that don't work with BrowserRouter.

## Changes Made:
1. **Updated GoogleSignIn.js**: 
   - Added `import api from '../api'` 
   - Changed `fetch('/api/auth/google/config/')` to `api.get('auth/google/config/')`
   - Changed `fetch('/api/auth/google/', {...})` to `api.post('auth/google/', {...})`

## Testing Steps:

### 1. **Verify Backend is Running**
```bash
cd backend
python manage.py runserver
```
Should show: `✅ Google OAuth2 credentials configured`

### 2. **Verify React Frontend is Running**
```bash
cd frontend  
npm start
```

### 3. **Test API Endpoints**
Open browser and check:
- Development: `http://localhost:8000/api/auth/google/config/`
- Should return: `{"client_id": "47691699395-89mtbiinbln0jvvkcsirmrocj55in98t.apps.googleusercontent.com"}`

### 4. **Check Browser Console**
- Should NOT see: `Failed to initialize Google Sign-In: SyntaxError: Unexpected token '<'`
- Should see: Google Sign-In button appears correctly

## Common Issues:

### If still getting HTML instead of JSON:
1. **Backend not running**: Start Django server
2. **Wrong environment**: Check `.env` file has Google OAuth credentials
3. **Proxy issue**: Restart React development server
4. **CORS issue**: Check Django CORS settings

### If Google button doesn't appear:
1. Check browser console for errors
2. Verify Google Identity Services script is loaded
3. Check network tab for successful API calls

## Environment Variables Required:
- Backend `.env` file should have:
  ```
  GOOGLE_OAUTH2_CLIENT_ID=47691699395-89mtbiinbln0jvvkcsirmrocj55in98t.apps.googleusercontent.com
  GOOGLE_OAUTH2_CLIENT_SECRET=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
  ```

The fix ensures that with BrowserRouter, all Google OAuth API calls use the configured base URL instead of relative paths that would try to fetch from the React domain.
