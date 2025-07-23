# VikraHub Custom Domain Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Domain Configuration
- [ ] Domain purchased: `vikrahub.com`
- [ ] Access to domain registrar's DNS management
- [ ] Choose hosting platform (Render recommended)

### 2. Code Preparation
- [x] Django ALLOWED_HOSTS updated with custom domain
- [x] Django CORS_ALLOWED_ORIGINS updated
- [x] Django CSRF_TRUSTED_ORIGINS added
- [x] Frontend .env.production updated with custom API URL
- [x] Render configuration files created

## 🚀 Deployment Steps

### Phase 1: Deploy Code Changes (Do First)
```bash
# 1. Commit all changes
git add .
git commit -m "feat: Configure custom domain vikrahub.com"
git push origin main

# 2. Deploy to current hosting platform first
# This ensures your code works before adding custom domain
```

### Phase 2: Configure DNS (Domain Registrar)
1. **Login to your domain registrar** (GoDaddy, Namecheap, etc.)
2. **Navigate to DNS Management** for vikrahub.com
3. **Add DNS records** (see DNS_CONFIGURATION.md):
   ```
   Type    Name        Value                   TTL
   A       @           216.24.57.1             3600
   A       @           216.24.57.2             3600
   CNAME   www         cname.render.com        3600
   CNAME   api         cname.render.com        3600
   ```
4. **Save DNS changes**
5. **Wait 24-48 hours** for DNS propagation

### Phase 3: Configure Hosting Platform

#### For Render:
1. **Backend Custom Domain**:
   - Go to Render Dashboard → vikrahub-backend service
   - Settings → Custom Domains → Add Domain
   - Enter: `api.vikrahub.com`
   - Wait for SSL certificate (5-10 minutes)

2. **Frontend Custom Domain**:
   - Go to Render Dashboard → vikrahub-frontend service
   - Settings → Custom Domains → Add Domain
   - Enter: `vikrahub.com`
   - Add another: `www.vikrahub.com` 
   - Wait for SSL certificates (5-10 minutes)

3. **Update Environment Variables**:
   - Backend: Add `CORS_ALLOWED_ORIGINS=https://vikrahub.com,https://www.vikrahub.com`
   - Frontend: Update `REACT_APP_API_URL=https://api.vikrahub.com/api/`

### Phase 4: Testing & Verification

#### DNS Verification:
```bash
# Check DNS propagation
nslookup vikrahub.com
nslookup www.vikrahub.com  
nslookup api.vikrahub.com

# Should resolve to Render IPs
```

#### API Testing:
```bash
# Test API endpoint
curl https://api.vikrahub.com/api/freelancer-profiles/

# Should return JSON response
```

#### Frontend Testing:
```bash
# Test main domain
curl -I https://vikrahub.com

# Test www redirect
curl -I https://www.vikrahub.com

# Should return 200 OK
```

#### Browser Testing:
1. Visit `https://vikrahub.com`
2. Check featured creators load (from real API)
3. Navigate to `/creators` page
4. Verify all functionality works
5. Check browser console for errors

## 🔧 Configuration Files Summary

### Updated Files:
- [x] `backend/vikrahub/settings.py` - Django domain configuration
- [x] `frontend/.env.production` - Frontend production environment
- [x] `render-custom-domain.yaml` - Updated Render configuration
- [x] `CUSTOM_DOMAIN_SETUP.md` - Complete setup guide
- [x] `DNS_CONFIGURATION.md` - DNS records template

### Environment Variables to Update:
```bash
# Backend (Render)
ALLOWED_HOSTS=vikrahub.com,www.vikrahub.com,api.vikrahub.com
CORS_ALLOWED_ORIGINS=https://vikrahub.com,https://www.vikrahub.com
DEBUG=False

# Frontend (Render)  
REACT_APP_API_URL=https://api.vikrahub.com/api/
NODE_ENV=production
```

## 🚨 Common Issues & Solutions

### Issue: DNS not propagating
**Solution**: Wait 24-48 hours, try different DNS servers (8.8.8.8)

### Issue: SSL certificate not generating
**Solution**: Ensure DNS points to hosting platform first

### Issue: CORS errors after domain setup
**Solution**: Verify Django CORS settings include new domain

### Issue: API calls failing
**Solution**: Check ALLOWED_HOSTS includes api.vikrahub.com

## 📞 Next Steps

1. **Choose deployment approach**:
   - Option A: Deploy code first, then configure domain
   - Option B: Configure DNS first, then deploy with domain settings

2. **Monitor deployment**:
   - Check hosting platform logs
   - Monitor DNS propagation status
   - Test all functionality after domain activation

3. **Post-deployment tasks**:
   - Set up monitoring/analytics for new domain
   - Update any hardcoded URLs in content
   - Inform users about new domain

---

**Ready to deploy?** Let me know which phase you'd like to start with!
