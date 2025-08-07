# VikraHub Logo Implementation Guide

"""
To use the actual VikraHub logo in the email template, replace the placeholder
image URL in the HTML template with one of these options:
"""

# Option 1: Host logo on your domain (Recommended)
LOGO_URL_SELF_HOSTED = "https://vikrahub.com/static/images/vikrahub-logo-email.png"

# Option 2: Use a CDN like Cloudinary (if configured)
LOGO_URL_CLOUDINARY = "https://res.cloudinary.com/your-cloud/image/upload/v1/vikrahub-logo-email"

# Option 3: Use GitHub raw content (for open source projects)
LOGO_URL_GITHUB = "https://raw.githubusercontent.com/yourusername/vikrahub/main/assets/vikrahub-logo.png"

# Option 4: Base64 embedded (for small logos, not recommended for large files)
LOGO_BASE64_EXAMPLE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

"""
EMAIL TEMPLATE LOGO REQUIREMENTS:

1. Size: 120px width, auto height (recommended)
2. Format: PNG with transparency or SVG
3. File size: Under 50KB for best email client support
4. Alt text: "VikraHub Logo" for accessibility

IMPLEMENTATION STEPS:

1. Save your VikraHub logo to: frontend/public/static/images/vikrahub-logo-email.png
2. Update the HTML template image src:
   <img src="https://vikrahub.com/static/images/vikrahub-logo-email.png" 
        alt="VikraHub Logo" 
        class="logo">

3. For dark mode compatibility, consider creating two versions:
   - vikrahub-logo-light.png (for dark backgrounds)
   - vikrahub-logo-dark.png (for light backgrounds)

4. Test across major email clients:
   - Gmail (web, mobile)
   - Outlook (desktop, web)
   - Apple Mail
   - Yahoo Mail
"""

# Update HTML template logo section:
LOGO_HTML_UPDATED = """
<!-- Replace this section in verify_email.html -->
<img src="https://vikrahub.com/static/images/vikrahub-logo-email.png" 
     alt="VikraHub Logo" 
     class="logo"
     style="display: block; margin: 0 auto 20px auto; max-width: 120px; height: auto;">
"""

# Dark mode logo variant (optional):
LOGO_HTML_DARK_MODE = """
<!-- For advanced dark mode support -->
<picture>
    <source media="(prefers-color-scheme: dark)" 
            srcset="https://vikrahub.com/static/images/vikrahub-logo-light.png">
    <img src="https://vikrahub.com/static/images/vikrahub-logo-dark.png" 
         alt="VikraHub Logo" 
         class="logo"
         style="display: block; margin: 0 auto 20px auto; max-width: 120px; height: auto;">
</picture>
"""
