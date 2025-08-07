# Example: Using VikraHub Branded Email Template

"""
This example shows how to use the VikraHub branded email verification template
in your Django application.

The template includes:
- VikraHub brand colors (#000223 and #ffa000)
- Responsive design for all devices
- Dark mode support
- Professional styling with gradients and shadows
- Fallback plain text version
- Security notices and professional footer
"""

from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from datetime import datetime

def send_verification_email_example(user, verification_url):
    """
    Example function showing how to send VikraHub branded verification email
    """
    
    # Prepare template context
    context = {
        'user_name': getattr(user, 'first_name', '') or getattr(user, 'username', ''),
        'verification_url': verification_url,
        'current_year': datetime.now().year,
    }
    
    # Email details
    subject = "Welcome to VikraHub! Please verify your email"
    from_email = settings.DEFAULT_FROM_EMAIL or "noreply@vikrahub.com"
    to_email = user.email
    
    # Render both HTML and text templates
    html_content = render_to_string('emails/verify_email.html', context)
    text_content = render_to_string('emails/verify_email.txt', context)
    
    # Create email message with both HTML and text versions
    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_content,  # Plain text fallback
        from_email=from_email,
        to=[to_email]
    )
    
    # Attach HTML version
    msg.attach_alternative(html_content, "text/html")
    
    # Send the email
    msg.send()
    
    return True

# Template Features:
"""
1. BRAND COLORS:
   - Primary: #000223 (Dark navy)
   - Accent: #ffa000 (Orange)

2. RESPONSIVE DESIGN:
   - Mobile-first approach
   - Optimized for all screen sizes
   - Email client compatibility

3. DARK MODE SUPPORT:
   - Automatic detection
   - Proper color schemes for both modes

4. TEMPLATE VARIABLES:
   - {{ user_name }} - User's first name or username
   - {{ verification_url }} - Complete verification link
   - {{ current_year }} - Current year for copyright

5. EMAIL CLIENT COMPATIBILITY:
   - Outlook support with MSO conditionals
   - Gmail, Apple Mail, Thunderbird tested
   - Fallback fonts and styles

6. SECURITY FEATURES:
   - Clear expiration notice (3 days)
   - Security warning for unexpected emails
   - HTTPS links for production

7. PROFESSIONAL ELEMENTS:
   - VikraHub logo placeholder
   - Gradient backgrounds
   - Hover effects on buttons
   - Professional footer with contact info
"""

# File Structure:
"""
backend/core/templates/emails/
├── verify_email.html    # Branded HTML template
└── verify_email.txt     # Plain text fallback

The templates are automatically discovered by Django's template loader
and can be customized further as needed.
"""
