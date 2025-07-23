# VikraHub Custom Domain Setup Guide

## Domain: vikrahub.com

This guide will help you configure your custom domain `vikrahub.com` for your VikraHub application.

## 🌐 Domain Configuration Overview

Your VikraHub application has two parts:
- **Frontend (React)**: Will be accessible at `vikrahub.com`
- **Backend (Django API)**: Will be accessible at `api.vikrahub.com`

## 📋 Prerequisites

- [x] Domain purchased: `vikrahub.com`
- [x] Domain registrar: Namecheap ✅ (Fully supported!)
- [ ] Access to Namecheap DNS management
- [ ] Hosting platform chosen (Render or Netlify)
- [ ] SSL certificate (automatically provided by hosting platforms)

> **Note**: This setup works perfectly with **Namecheap**! See `NAMECHEAP_DNS_SETUP.md` for detailed Namecheap-specific instructions.

## 🚀 Option 1: Deployment with Render (Recommended)

### Step 1: Configure DNS at Your Domain Registrar

Add these DNS records at **Namecheap** (or your domain registrar):

> **For Namecheap users**: See detailed step-by-step instructions in `NAMECHEAP_DNS_SETUP.md`

```dns
Type    Name        Value                           TTL
CNAME   www         cname.render.com                3600
CNAME   api         cname.render.com                3600
A       @           216.24.57.1                     3600
A       @           216.24.57.2                     3600
```

**Namecheap-specific notes:**
- Use "Advanced DNS" tab in your domain management
- Host field: Use "@" for root domain, "www" for www subdomain
- TTL: Use "Automatic" or 3600 seconds

### Step 2: Update Render Configuration

**For Backend (Django API):**
1. Go to Render Dashboard → Your backend service
2. Navigate to "Settings" → "Custom Domains"
3. Add domain: `api.vikrahub.com`
4. Wait for SSL certificate generation

**For Frontend (React):**
1. Go to Render Dashboard → Your frontend service
2. Navigate to "Settings" → "Custom Domains"
3. Add domain: `vikrahub.com`
4. Add domain: `www.vikrahub.com`
5. Wait for SSL certificate generation

### Step 3: Update Environment Variables

Update your frontend environment to use the custom API domain:

```yaml
# In render.yaml
envVars:
  - key: REACT_APP_API_URL
    value: https://api.vikrahub.com/api/
```

## 🌟 Option 2: Deployment with Netlify + Render

### Step 1: Configure DNS

```dns
Type    Name        Value                           TTL
CNAME   www         netlify.app                     3600
CNAME   api         cname.render.com                3600
A       @           75.2.60.5                       3600
AAAA    @           2600:1f14:bef:d900::d9b:7b32    3600
```

### Step 2: Configure Netlify

1. Go to Netlify Dashboard → Your site
2. Navigate to "Domain settings"
3. Add custom domain: `vikrahub.com`
4. Enable HTTPS (automatic)

### Step 3: Configure Render for Backend

1. Go to Render Dashboard → Your backend service
2. Add custom domain: `api.vikrahub.com`

## 🔧 Code Updates Required

### 1. Update Frontend API Configuration

```javascript
// frontend/src/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.vikrahub.com/api/';
```

### 2. Update Django Settings

```python
# backend/vikrahub/settings.py
ALLOWED_HOSTS = [
    'vikrahub.com',
    'www.vikrahub.com',
    'api.vikrahub.com',
    '127.0.0.1',
    'localhost',
]

CORS_ALLOWED_ORIGINS = [
    "https://vikrahub.com",
    "https://www.vikrahub.com",
    "http://localhost:3000",
]

# CSRF Settings
CSRF_TRUSTED_ORIGINS = [
    'https://vikrahub.com',
    'https://www.vikrahub.com',
    'https://api.vikrahub.com',
]
```

### 3. Update Frontend Environment

```bash
# frontend/.env.production
REACT_APP_API_URL=https://api.vikrahub.com/api/
```

## 📝 Step-by-Step Implementation

### Phase 1: DNS Configuration (Do this first)
1. **Login to Namecheap** (or your domain registrar)
2. **Navigate to Advanced DNS** management for vikrahub.com
3. **Add the DNS records** (see NAMECHEAP_DNS_SETUP.md for detailed steps)
4. **Wait 2-48 hours** for DNS propagation (Namecheap average: 2-24 hours)

### Phase 2: Update Code
1. **Update Django settings** (ALLOWED_HOSTS, CORS, CSRF)
2. **Update frontend API configuration**
3. **Test locally** with new settings

### Phase 3: Deploy with Custom Domain
1. **Push code changes** to GitHub
2. **Configure custom domains** in hosting platform
3. **Update environment variables**
4. **Test production deployment**

## 🔍 Verification Steps

### Check DNS Propagation
```bash
# Check if DNS is propagated
nslookup vikrahub.com
nslookup api.vikrahub.com
nslookup www.vikrahub.com
```

### Test API Connection
```bash
# Test API endpoint
curl https://api.vikrahub.com/api/freelancer-profiles/
```

### Test Frontend
```bash
# Visit in browser
https://vikrahub.com
https://www.vikrahub.com
```

## 🚨 Common Issues & Solutions

### Issue 1: DNS not propagating
**Solution**: Wait 24-48 hours, use different DNS (8.8.8.8)

### Issue 2: CORS errors
**Solution**: Ensure CORS_ALLOWED_ORIGINS includes your domain

### Issue 3: SSL certificate issues
**Solution**: Wait for automatic generation, contact hosting support

### Issue 4: API not accessible
**Solution**: Check ALLOWED_HOSTS and backend deployment

## 📞 Next Steps

1. **Choose hosting platform** (Render recommended)
2. **Configure DNS records** at your registrar
3. **Let me know when DNS is configured** - I'll help with code updates
4. **Deploy with custom domain**

## 🎯 Expected Result

After successful configuration:
- ✅ `vikrahub.com` → VikraHub frontend
- ✅ `www.vikrahub.com` → VikraHub frontend  
- ✅ `api.vikrahub.com` → Django API
- ✅ SSL certificates automatically provisioned
- ✅ All cross-origin requests working properly

---

**Next:** Let me know your preferred hosting platform and I'll help you implement the specific configuration steps!
