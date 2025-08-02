# VikraHub SEO Setup

This document outlines the SEO configuration for VikraHub, including sitemap generation, robots.txt configuration, and best practices.

## Files Overview

### 📄 Frontend SEO Files
- `frontend/public/sitemap.xml` - Static XML sitemap for search engines
- `frontend/public/robots.txt` - Robots.txt file with crawling instructions
- `frontend/build/sitemap.xml` - Production sitemap (auto-generated)
- `frontend/build/robots.txt` - Production robots.txt (auto-generated)

### 🔧 Automation Scripts
- `frontend/generate-sitemap.js` - Dynamic sitemap generator
- `frontend/copy-seo-files.js` - Build-time SEO files copier

### 🐍 Backend SEO (Django)
- `backend/core/sitemaps.py` - Django sitemap classes
- `backend/vikrahub/urls.py` - Sitemap URL configuration

## How It Works

### 1. Sitemap Generation
The sitemap is automatically generated in multiple ways:

#### Static Frontend Sitemap
- **Location**: `https://www.vikrahub.com/sitemap.xml`
- **Content**: Main React routes and static pages
- **Priority Order**:
  - Homepage (1.0) - Highest priority
  - Explore (0.9) - High priority for creative content
  - About, Inspiration, Marketplace (0.8) - Important pages
  - Blog, Contact, Services (0.7) - Regular content
  - Auth pages (0.6) - Medium priority
  - Legal pages (0.3) - Low priority

#### Dynamic Backend Sitemap
- **Location**: `https://www.vikrahub.com/sitemap.xml` (Django)
- **Content**: Blog posts, API endpoints, portfolio items
- **Auto-updates**: Based on database content

### 2. Robots.txt Configuration
```
User-agent: *
Allow: /

# Sitemap
Sitemap: https://www.vikrahub.com/sitemap.xml

# Disallow admin and private areas
Disallow: /admin/
Disallow: /dashboard/
Disallow: /profile/edit/
Disallow: /messages/
```

### 3. Build Process Integration

#### Package.json Scripts
```json
{
  "scripts": {
    "prebuild": "node generate-sitemap.js",    // Generate sitemap before build
    "build": "react-scripts build && node copy-seo-files.js",  // Build and copy SEO files
    "postbuild": "node copy-seo-files.js",     // Ensure SEO files are copied
    "generate-sitemap": "node generate-sitemap.js"  // Manual sitemap generation
  }
}
```

## Manual Commands

### Generate Sitemap
```bash
cd frontend
npm run generate-sitemap
```

### Copy SEO Files to Build
```bash
cd frontend
node copy-seo-files.js
```

### Full Build with SEO
```bash
cd frontend
npm run build
```

## SEO Best Practices Implemented

### ✅ Technical SEO
- [x] Valid XML sitemap format
- [x] Proper robots.txt configuration
- [x] Search engine friendly URLs
- [x] Automated sitemap updates
- [x] Priority and changefreq optimization

### ✅ Content Structure
- [x] Homepage as highest priority (1.0)
- [x] Content pages with appropriate priorities
- [x] Regular update frequencies for dynamic content
- [x] Blocked private/admin areas

### ✅ Automation
- [x] Pre-build sitemap generation
- [x] Post-build file copying
- [x] Date-based lastmod timestamps
- [x] Error handling and logging

## Verification Steps

### 1. Check Sitemap Accessibility
```bash
curl https://www.vikrahub.com/sitemap.xml
```

### 2. Validate XML Format
- Use Google Search Console
- Use online XML validators
- Check for proper encoding and structure

### 3. Test Robots.txt
```bash
curl https://www.vikrahub.com/robots.txt
```

### 4. Submit to Search Engines
- Google Search Console
- Bing Webmaster Tools
- Other relevant search engines

## Troubleshooting

### Common Issues

#### 1. "Sitemap is HTML" Error
**Cause**: Frontend serving HTML instead of XML
**Solution**: Ensure sitemap.xml is in build folder and server serves it correctly

#### 2. Missing Robots.txt
**Cause**: File not copied to production
**Solution**: Run `npm run build` to trigger automated copying

#### 3. Outdated Sitemap
**Cause**: Static sitemap not updated
**Solution**: Run `npm run generate-sitemap` to update

### Files to Check
1. Verify `frontend/build/sitemap.xml` exists and is valid XML
2. Verify `frontend/build/robots.txt` points to correct sitemap
3. Check server configuration serves XML with correct MIME type
4. Ensure production deployment includes these files

## Maintenance

### Regular Tasks
1. **Monthly**: Update sitemap priorities based on analytics
2. **Quarterly**: Review and update static page list
3. **As needed**: Add new routes to sitemap generator

### When Adding New Pages
1. Add route to `generate-sitemap.js` config
2. Set appropriate priority and changefreq
3. Regenerate sitemap: `npm run generate-sitemap`
4. Redeploy to production

## Performance Impact
- ✅ Minimal: Scripts run only during build time
- ✅ No runtime overhead
- ✅ Small file sizes (< 5KB for sitemap)
- ✅ Cached by CDN/hosting provider
