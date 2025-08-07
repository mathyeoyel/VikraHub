#!/usr/bin/env python3
"""
Test script for VikraHub email verification template

This script allows you to test the email template locally and see how it renders.
"""

import os
import sys
import django
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).resolve().parent
sys.path.append(str(backend_dir))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
django.setup()

from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from datetime import datetime

def test_email_template():
    """
    Test the VikraHub email verification template
    """
    # Mock user data for testing
    context = {
        'user_name': 'John Doe',
        'verification_url': 'https://vikrahub.com/api/users/verify-email/test-token-12345/',
        'current_year': datetime.now().year,
    }
    
    try:
        # Render templates
        html_content = render_to_string('emails/verify_email.html', context)
        text_content = render_to_string('emails/verify_email.txt', context)
        
        print("✅ Email templates rendered successfully!")
        print(f"📧 HTML content length: {len(html_content)} characters")
        print(f"📄 Text content length: {len(text_content)} characters")
        
        # Save rendered HTML for preview
        output_file = backend_dir / 'email_preview.html'
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"💾 HTML preview saved to: {output_file}")
        print("🌐 Open this file in your browser to preview the email!")
        
        # Show text version
        print("\n" + "="*60)
        print("TEXT VERSION PREVIEW:")
        print("="*60)
        print(text_content)
        
        return True
        
    except Exception as e:
        print(f"❌ Error rendering email templates: {e}")
        return False

def send_test_email(test_email):
    """
    Send a test email to verify SMTP configuration
    
    Args:
        test_email (str): Email address to send test to
    """
    if not test_email:
        print("⚠️  No test email provided. Skipping email send test.")
        return False
    
    context = {
        'user_name': 'Test User',
        'verification_url': 'https://vikrahub.com/api/users/verify-email/test-token-12345/',
        'current_year': datetime.now().year,
    }
    
    try:
        html_content = render_to_string('emails/verify_email.html', context)
        text_content = render_to_string('emails/verify_email.txt', context)
        
        subject = "VikraHub Email Template Test"
        from_email = settings.DEFAULT_FROM_EMAIL or "noreply@vikrahub.com"
        
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=[test_email]
        )
        
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        
        print(f"✅ Test email sent successfully to {test_email}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send test email: {e}")
        return False

if __name__ == "__main__":
    print("🚀 VikraHub Email Template Test")
    print("="*40)
    
    # Test template rendering
    if test_email_template():
        print("\n🎉 Email template test completed successfully!")
        
        # Ask if user wants to send test email
        test_email = input("\n📧 Enter email address to send test email (or press Enter to skip): ").strip()
        if test_email:
            send_test_email(test_email)
    else:
        print("\n❌ Email template test failed!")
        sys.exit(1)
