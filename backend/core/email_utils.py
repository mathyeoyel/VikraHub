# backend/core/email_utils.py
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.urls import reverse
from django.contrib.sites.models import Site
import logging

logger = logging.getLogger(__name__)


def send_verification_email(user, verification_token):
    """
    Send email verification email to user
    """
    try:
        # Get current site domain
        current_site = Site.objects.get_current()
        domain = current_site.domain
        
        # Create verification URL
        verification_url = f"http://{domain}/api/users/verify-email/{verification_token}/"
        
        # Email context
        context = {
            'user': user,
            'verification_url': verification_url,
            'site_name': current_site.name,
            'domain': domain,
            'token': verification_token,
        }
        
        # Render email templates
        subject = f"Verify your email address - {current_site.name}"
        
        # HTML email content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Email Verification</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #007bff; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 30px; background: #f9f9f9; }}
                .button {{ display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ padding: 20px; text-align: center; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to {current_site.name}!</h1>
                </div>
                <div class="content">
                    <h2>Hi {user.first_name or user.username}!</h2>
                    <p>Thank you for signing up for {current_site.name}. To complete your registration, please verify your email address by clicking the button below:</p>
                    
                    <div style="text-align: center;">
                        <a href="{verification_url}" class="button">Verify Email Address</a>
                    </div>
                    
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 3px;">
                        {verification_url}
                    </p>
                    
                    <p><strong>Important:</strong> This verification link will expire in 3 days.</p>
                    
                    <p>If you didn't create an account with us, please ignore this email.</p>
                </div>
                <div class="footer">
                    <p>© 2025 {current_site.name}. All rights reserved.</p>
                    <p>This is an automated email. Please do not reply to this message.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Plain text version
        text_content = f"""
        Hi {user.first_name or user.username}!
        
        Thank you for signing up for {current_site.name}. To complete your registration, please verify your email address by visiting this link:
        
        {verification_url}
        
        This verification link will expire in 3 days.
        
        If you didn't create an account with us, please ignore this email.
        
        Thanks,
        The {current_site.name} Team
        """
        
        # Create email message
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email]
        )
        email.attach_alternative(html_content, "text/html")
        
        # Send email
        email.send()
        
        logger.info(f"Verification email sent to {user.email}")
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
