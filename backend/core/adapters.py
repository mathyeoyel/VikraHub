from allauth.account.adapter import DefaultAccountAdapter
from django.http import Http404

class NoSignupAccountAdapter(DefaultAccountAdapter):
    """
    Custom account adapter that disables Django Allauth signup
    to force users to use our custom registration endpoint
    """
    
    def is_open_for_signup(self, request):
        """
        Disable Django Allauth signup - users must use our custom registration
        """
        return False
    
    def save_user(self, request, user, form, commit=True):
        """
        Override to prevent Django Allauth from activating users automatically
        """
        # Don't save through Django Allauth - redirect to our custom registration
        raise Http404("Registration not available through this endpoint")
    
    def confirm_email(self, request, email_address):
        """
        Override email confirmation to use our custom verification system
        """
        # Let our custom verification system handle this
        pass
