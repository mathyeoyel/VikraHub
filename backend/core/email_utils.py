# backend/core/email_utils.py
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.urls import reverse
from django.contrib.sites.models import Site
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


def send_verification_email(user, verification_token):
    """
    Send branded email verification email to user using VikraHub template
    """
    try:
        # Get current site domain
        current_site = Site.objects.get_current()
        domain = current_site.domain
        
        # Use HTTPS for production, HTTP for development
        protocol = 'https' if not settings.DEBUG else 'http'
        
        # Create verification URL
        verification_url = f"{protocol}://{domain}/api/users/verify-email/{verification_token}/"
        
        # Email context for template rendering
        context = {
            'user_name': getattr(user, 'first_name', '') or getattr(user, 'username', ''),
            'verification_url': verification_url,
            'site_name': 'VikraHub',
            'domain': domain,
            'current_year': datetime.now().year,
        }
        
        # Email subject
        subject = "Welcome to VikraHub! Please verify your email"
        from_email = settings.DEFAULT_FROM_EMAIL or "noreply@vikrahub.com"
        to_email = user.email
        
        # Render both HTML and text templates
        html_content = render_to_string('emails/verify_email.html', context)
        text_content = render_to_string('emails/verify_email.txt', context)
        
        # Create and send email using Django's EmailMultiAlternatives
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,  # Plain text version
            from_email=from_email,
            to=[to_email]
        )
        
        # Attach HTML version
        msg.attach_alternative(html_content, "text/html")
        
        # Send the email
        msg.send()
        
        logger.info(f"Verification email sent successfully to {user.email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send verification email to {user.email}: {str(e)}")
        return False


def send_welcome_email(user):
    """
    Send welcome email after successful verification
    """
    try:
        # Get current site domain
        current_site = Site.objects.get_current()
        
        subject = f"Welcome to {current_site.name}!"
        
        # HTML email content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Welcome!</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #28a745; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 30px; background: #f9f9f9; }}
                .button {{ display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ padding: 20px; text-align: center; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Welcome to {current_site.name}!</h1>
                </div>
                <div class="content">
                    <h2>Hi {user.first_name or user.username}!</h2>
                    <p>Congratulations! Your email has been successfully verified and your account is now active.</p>
                    
                    <p>You can now:</p>
                    <ul>
                        <li>Complete your profile</li>
                        <li>Browse and connect with other creators</li>
                        <li>Start messaging other users</li>
                        <li>Upload your portfolio</li>
                        <li>Explore services and opportunities</li>
                    </ul>
                    
                    <div style="text-align: center;">
                        <a href="http://{current_site.domain}/dashboard" class="button">Go to Dashboard</a>
                    </div>
                    
                    <p>If you have any questions, feel free to contact our support team.</p>
                </div>
                <div class="footer">
                    <p>© 2025 {current_site.name}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Plain text version
        text_content = f"""
        Hi {user.first_name or user.username}!
        
        Congratulations! Your email has been successfully verified and your account is now active.
        
        You can now explore all the features of {current_site.name}.
        
        Visit your dashboard: http://{current_site.domain}/dashboard
        
        Welcome aboard!
        The {current_site.name} Team
        """
        
        # Create and send email
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email]
        )
        email.attach_alternative(html_content, "text/html")
        email.send()
        
        logger.info(f"Welcome email sent to {user.email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send welcome email to {user.email}: {str(e)}")
        return False


def resend_verification_email(user):
    """
    Resend verification email for unverified user
    """
    from .models import EmailVerification
    
    try:
        # Get or create new verification token
        verification = EmailVerification.create_for_user(user)
        
        # Send verification email
        return send_verification_email(user, verification.token)
        
    except Exception as e:
        logger.error(f"Failed to resend verification email to {user.email}: {str(e)}")
        return False
