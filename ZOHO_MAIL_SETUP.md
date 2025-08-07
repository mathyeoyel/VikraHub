# Zoho Mail Configuration Guide for VikraHub Email Verification

## Overview
This guide will help you configure Zoho Mail for sending email verification emails in your VikraHub application.

## Prerequisites
- Zoho Mail account (free or paid)
- Custom domain configured with Zoho (optional but recommended)
- Access to your server environment variables

## Zoho Mail SMTP Settings

### Standard Configuration
```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.zoho.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@yourdomain.com
EMAIL_HOST_PASSWORD=your-zoho-password
DEFAULT_FROM_EMAIL=your-email@yourdomain.com
```

### Alternative Configurations

#### Using SSL (Port 465)
```bash
EMAIL_HOST=smtp.zoho.com
EMAIL_PORT=465
EMAIL_USE_SSL=True
EMAIL_USE_TLS=False
```

#### Using Custom Domain
If you have a custom domain with Zoho:
```bash
EMAIL_HOST_USER=noreply@yourdomain.com
DEFAULT_FROM_EMAIL=VikraHub <noreply@yourdomain.com>
```

## Step-by-Step Setup

### 1. Create Zoho Mail Account
1. Go to [Zoho Mail](https://www.zoho.com/mail/)
2. Sign up for a free account or use existing account
3. Verify your email address

### 2. Set Up Custom Domain (Optional but Recommended)
1. Log into Zoho Admin Console
2. Go to Mail → Email Hosting → Domains
3. Add your custom domain
4. Follow DNS verification steps
5. Create email accounts (e.g., noreply@yourdomain.com)

### 3. Configure Environment Variables

#### For Development (.env file)
Create a `.env` file in your backend directory:
```bash
# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.zoho.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=noreply@yourdomain.com
EMAIL_HOST_PASSWORD=your-actual-password
DEFAULT_FROM_EMAIL=VikraHub <noreply@yourdomain.com>
```

#### For Production (Server Environment)
Set these environment variables on your hosting platform:
- `EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend`
- `EMAIL_HOST=smtp.zoho.com`
- `EMAIL_PORT=587`
- `EMAIL_USE_TLS=True`
- `EMAIL_HOST_USER=noreply@yourdomain.com`
- `EMAIL_HOST_PASSWORD=your-actual-password`
- `DEFAULT_FROM_EMAIL=VikraHub <noreply@yourdomain.com>`

### 4. Security Best Practices

#### Use App-Specific Passwords
1. Log into Zoho Account
2. Go to Security → App Passwords
3. Generate an app-specific password for Django
4. Use this password instead of your main account password

#### Enable Two-Factor Authentication
1. Go to Zoho Account Security settings
2. Enable 2FA for additional security
3. This won't affect SMTP authentication

### 5. Test Configuration

#### Test in Django Shell
```python
python manage.py shell

# Test email sending
from django.core.mail import send_mail
send_mail(
    'Test Subject',
    'Test message body.',
    'noreply@yourdomain.com',
    ['test@example.com'],
    fail_silently=False,
)
```

#### Test Email Verification
1. Register a new user account
2. Check server logs for email output
3. Verify the email is sent from your Zoho account

## Troubleshooting

### Common Issues

#### Authentication Failed
- Double-check email and password
- Use app-specific password if 2FA is enabled
- Ensure SMTP is enabled in Zoho settings

#### Connection Timeout
- Check firewall settings
- Verify server can connect to smtp.zoho.com:587
- Try using port 465 with SSL instead

#### Email Not Delivered
- Check spam/junk folders
- Verify sender domain reputation
- Check Zoho Mail logs in admin console

### Debug Commands
```bash
# Test SMTP connection
python -c "
import smtplib
server = smtplib.SMTP('smtp.zoho.com', 587)
server.starttls()
server.login('your-email@domain.com', 'your-password')
print('SMTP connection successful!')
server.quit()
"

# Check Django email settings
python manage.py shell
>>> from django.conf import settings
>>> print(f'Email Backend: {settings.EMAIL_BACKEND}')
>>> print(f'Email Host: {settings.EMAIL_HOST}')
>>> print(f'Email Port: {settings.EMAIL_PORT}')
```

## Email Templates

### Verification Email Template
The system will automatically send professional-looking HTML emails with:
- VikraHub branding
- Clear verification button
- Fallback verification link
- Professional styling

### Customizing Email Content
You can customize the email templates by editing:
- `backend/core/email_utils.py` - Email content and styling
- Subject lines and message content
- HTML templates and CSS styling

## Production Recommendations

### 1. Domain Setup
- Use a professional email like `noreply@yourdomain.com`
- Set up SPF, DKIM, and DMARC records
- Use a dedicated sending domain

### 2. Monitoring
- Monitor email delivery rates
- Set up logging for email failures
- Track verification completion rates

### 3. Rate Limiting
- Implement rate limiting for verification emails
- Prevent abuse of the resend functionality
- Monitor for unusual sending patterns

## Zoho Mail Plans

### Free Plan
- 5 GB storage per user
- 25 MB attachment limit
- Basic SMTP access
- Good for development and small projects

### Paid Plans
- Increased storage and features
- Better deliverability
- Advanced admin controls
- Recommended for production use

## Support
- Zoho Mail Support: [https://help.zoho.com/portal/en/community/zoho-mail](https://help.zoho.com/portal/en/community/zoho-mail)
- Django Email Documentation: [https://docs.djangoproject.com/en/stable/topics/email/](https://docs.djangoproject.com/en/stable/topics/email/)

## Conclusion
With Zoho Mail configured, your VikraHub application will send professional verification emails to users. The setup is reliable, secure, and scales well for production use.

🎉 **Your email verification system is now ready with Zoho Mail!**
