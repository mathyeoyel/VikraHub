# DNS Configuration for vikrahub.com
# Add these records to your domain registrar's DNS management

## For Render Hosting (Recommended)

### DNS Records to Add:
```
Type    Name        Value                           TTL
A       @           216.24.57.1                     3600
A       @           216.24.57.2                     3600  
CNAME   www         cname.render.com                3600
CNAME   api         cname.render.com                3600
```

### Alternative APEX Records (if A records don't work):
```
Type    Name        Value                           TTL
ALIAS   @           cname.render.com                3600
CNAME   www         cname.render.com                3600
CNAME   api         cname.render.com                3600
```

## For Netlify + Render Hosting

### DNS Records to Add:
```
Type    Name        Value                           TTL
A       @           75.2.60.5                       3600
AAAA    @           2600:1f14:bef:d900::d9b:7b32    3600
CNAME   www         netlify.app                     3600
CNAME   api         cname.render.com                3600
```

## Expected Results After DNS Propagation:

- ✅ vikrahub.com → VikraHub Frontend
- ✅ www.vikrahub.com → VikraHub Frontend  
- ✅ api.vikrahub.com → Django Backend API

## Verification Commands:

```bash
# Check DNS propagation
nslookup vikrahub.com
nslookup www.vikrahub.com
nslookup api.vikrahub.com

# Test API endpoint
curl https://api.vikrahub.com/api/freelancer-profiles/

# Test frontend
curl -I https://vikrahub.com
```

## Important Notes:

1. **DNS Propagation**: Can take 24-48 hours
2. **SSL Certificates**: Automatically provisioned by hosting platforms
3. **Cloudflare Users**: Set SSL mode to "Full" or "Full (strict)"
4. **Subdomain Setup**: Both www and api subdomains are configured

## Troubleshooting:

### If DNS doesn't propagate:
- Wait 24-48 hours
- Try using different DNS servers (8.8.8.8, 1.1.1.1)
- Check with your registrar's support

### If SSL certificate fails:
- Ensure DNS is properly configured first
- Contact hosting platform support
- Check for conflicting CNAME records

### If CORS errors occur:
- Verify Django CORS settings include your domain
- Check ALLOWED_HOSTS includes your domain
- Ensure API calls use https://api.vikrahub.com
