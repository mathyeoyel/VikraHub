# Namecheap DNS Configuration for vikrahub.com

## 🌐 Namecheap-Specific Instructions

Namecheap is fully compatible with the VikraHub custom domain setup. Here's exactly how to configure your DNS records.

## 📋 Step-by-Step Namecheap Configuration

### Step 1: Access Namecheap DNS Management

1. **Login to Namecheap**
   - Go to [namecheap.com](https://namecheap.com)
   - Sign in to your account

2. **Navigate to Domain Management**
   - Click "Domain List" in the left sidebar
   - Find `vikrahub.com` and click "Manage"

3. **Access DNS Settings**
   - Click the "Advanced DNS" tab
   - You'll see the DNS records management interface

### Step 2: Add DNS Records for Render Hosting

**Clear existing records** (if any):
- Remove any existing A, CNAME records for @ and www

**Add these new records:**

```dns
Type    Host        Value                   TTL
A       @           216.24.57.1             Automatic
A       @           216.24.57.2             Automatic  
CNAME   www         cname.render.com        Automatic
CNAME   api         cname.render.com        Automatic
```

### Step 3: Detailed Namecheap Record Setup

#### Record 1: Main Domain (A Record)
- **Type**: A Record
- **Host**: @ 
- **Value**: 216.24.57.1
- **TTL**: Automatic (or 3600)

#### Record 2: Main Domain Backup (A Record)  
- **Type**: A Record
- **Host**: @
- **Value**: 216.24.57.2
- **TTL**: Automatic (or 3600)

#### Record 3: WWW Subdomain (CNAME)
- **Type**: CNAME Record
- **Host**: www
- **Value**: cname.render.com
- **TTL**: Automatic (or 3600)

#### Record 4: API Subdomain (CNAME)
- **Type**: CNAME Record  
- **Host**: api
- **Value**: cname.render.com
- **TTL**: Automatic (or 3600)

### Step 4: Save Configuration

1. **Save all records** - Click "Save All Changes" 
2. **Wait for propagation** - Namecheap typically takes 30 minutes to 48 hours

## 🔍 Namecheap-Specific Verification

### Check Namecheap DNS Tool
1. Go to Namecheap Dashboard
2. Use their "Domain Analysis" tool
3. Verify all records are properly set

### Command Line Verification
```bash
# Check if DNS is working
nslookup vikrahub.com
nslookup www.vikrahub.com  
nslookup api.vikrahub.com

# Check from different DNS servers
nslookup vikrahub.com 8.8.8.8
nslookup vikrahub.com 1.1.1.1
```

## 🎯 Expected Namecheap Results

After configuration, your Namecheap DNS should show:
- ✅ `vikrahub.com` → Points to Render (216.24.57.1 & 216.24.57.2)
- ✅ `www.vikrahub.com` → CNAME to cname.render.com
- ✅ `api.vikrahub.com` → CNAME to cname.render.com

## 🚨 Namecheap Common Issues & Solutions

### Issue 1: "Invalid CNAME" Error
**Solution**: Make sure Host field shows just "www" or "api", not "www.vikrahub.com"

### Issue 2: @ Symbol Not Working
**Solution**: Namecheap uses @ for root domain - this is correct

### Issue 3: TTL Options
**Solution**: Use "Automatic" or set to 3600 (1 hour)

### Issue 4: DNS Not Propagating
**Solutions**:
- Wait up to 48 hours (Namecheap average: 2-24 hours)
- Clear browser cache
- Try incognito/private browsing
- Use different DNS servers for testing

## 📱 Namecheap Mobile App

You can also configure DNS using the Namecheap mobile app:
1. Download "Namecheap" app
2. Login with your account
3. Navigate to your domain
4. Access "DNS Records"
5. Add the same records as above

## 🔧 Alternative: Namecheap + Cloudflare

If you want enhanced performance, you can use Cloudflare with Namecheap:

1. **At Namecheap**: Change nameservers to Cloudflare's
2. **At Cloudflare**: Add the same DNS records
3. **Benefit**: Better performance, caching, security

## 🎉 After DNS Configuration

Once your Namecheap DNS is configured:

1. **Test DNS propagation** (wait 2-24 hours)
2. **Configure custom domains** in Render dashboard
3. **Update environment variables** in your deployment
4. **Test your live site** at vikrahub.com

## 📞 Next Steps with Namecheap

1. **Configure DNS records** as shown above
2. **Wait for propagation** (check with nslookup)
3. **Let me know when DNS is ready** - I'll help with Render setup
4. **Deploy with custom domain**

---

**Namecheap is perfect for this setup!** The configuration will work exactly as designed. Let me know when you've added the DNS records and I'll help you with the next steps.
