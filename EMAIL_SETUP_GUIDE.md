# VikraHub Email Configuration for Production

# To enable actual email sending (instead of console output), you need to set these environment variables:

EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.zoho.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=noreply@vikrahub.com
EMAIL_HOST_PASSWORD=your_zoho_password_here
DEFAULT_FROM_EMAIL=noreply@vikrahub.com

# How to set these in different environments:

## 1. LOCAL DEVELOPMENT (.env file):
# Create a .env file in your backend/ directory with:
# EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
# EMAIL_HOST_USER=your-email@domain.com
# EMAIL_HOST_PASSWORD=your-password
# DEFAULT_FROM_EMAIL=your-email@domain.com

## 2. RENDER.COM PRODUCTION:
# In your Render dashboard:
# 1. Go to your service settings
# 2. Add Environment Variables:
#    - EMAIL_BACKEND = django.core.mail.backends.smtp.EmailBackend
#    - EMAIL_HOST_USER = noreply@vikrahub.com
#    - EMAIL_HOST_PASSWORD = your_zoho_password
#    - DEFAULT_FROM_EMAIL = noreply@vikrahub.com

## 3. TEST EMAIL CONFIGURATION:
# You can test if emails work by running:
# python manage.py shell
# >>> from django.core.mail import send_mail
# >>> send_mail('Test', 'Test message', 'noreply@vikrahub.com', ['test@example.com'])

# IMPORTANT NOTES:
# - Make sure your Zoho account allows SMTP access
# - Use an App Password if you have 2FA enabled
# - The email address must be verified in your Zoho account
# - Check spam/junk folders if emails don't appear in inbox

# TROUBLESHOOTING:
# If emails still don't send, check:
# 1. Zoho SMTP settings are correct
# 2. Firewall allows port 587
# 3. Email credentials are valid
# 4. Domain SPF/DKIM records are configured (for production)
