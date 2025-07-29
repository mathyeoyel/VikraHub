"""
Google OAuth2 Authentication for VikraHub
"""
import os
import logging
from django.contrib.auth.models import User
from django.contrib.auth import login
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from google.auth.transport import requests
from google.oauth2 import id_token
from .models import UserProfile
from .serializers import UserProfileSerializer

logger = logging.getLogger(__name__)

def get_tokens_for_user(user):
    """Generate JWT tokens for a user"""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth(request):
    """
    Authenticate user with Google OAuth2 ID token
    Expected payload: {"id_token": "google_id_token"}
    """
    try:
        id_token_string = request.data.get('id_token')
        if not id_token_string:
            return Response(
                {'error': 'ID token is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify the Google ID token
        client_id = os.environ.get('GOOGLE_OAUTH2_CLIENT_ID')
        if not client_id:
            logger.error("Google OAuth2 client ID not configured")
            return Response(
                {'error': 'Google authentication not configured'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        try:
            # Verify token with Google
            idinfo = id_token.verify_oauth2_token(
                id_token_string, 
                requests.Request(), 
                client_id
            )

            # Verify token issuer
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')

            # Extract user information
            google_id = idinfo['sub']
            email = idinfo.get('email')
            name = idinfo.get('name', '')
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')
            picture = idinfo.get('picture', '')

            if not email:
                return Response(
                    {'error': 'Email not provided by Google'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            logger.info(f"Google auth attempt for email: {email}")

            # Check if user exists or create new user
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email,  # Use email as username
                    'first_name': first_name,
                    'last_name': last_name,
                    'is_active': True,
                }
            )

            if created:
                logger.info(f"Created new user: {email}")
                # Create user profile
                profile, profile_created = UserProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'avatar': picture,
                        'user_type': 'client',  # Default to client
                    }
                )
                logger.info(f"Created user profile for: {email}")
            else:
                logger.info(f"Existing user logged in: {email}")
                # Update user info if needed
                if user.first_name != first_name or user.last_name != last_name:
                    user.first_name = first_name
                    user.last_name = last_name
                    user.save()

                # Update avatar if available and not already set
                try:
                    profile = user.userprofile
                    if picture and not profile.avatar:
                        profile.avatar = picture
                        profile.save()
                except UserProfile.DoesNotExist:
                    # Create profile if it doesn't exist
                    profile = UserProfile.objects.create(
                        user=user,
                        avatar=picture,
                        user_type='client'
                    )

            # Generate JWT tokens
            tokens = get_tokens_for_user(user)

            # Serialize user profile data
            profile_serializer = UserProfileSerializer(user.userprofile)

            return Response({
                'success': True,
                'message': 'Successfully authenticated with Google',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'profile': profile_serializer.data
                },
                'tokens': tokens,
                'created': created
            }, status=status.HTTP_200_OK)

        except ValueError as e:
            logger.error(f"Invalid Google token: {str(e)}")
            return Response(
                {'error': 'Invalid Google token'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    except Exception as e:
        logger.error(f"Google authentication error: {str(e)}")
        return Response(
            {'error': 'Authentication failed'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def google_auth_config(request):
    """
    Return Google OAuth2 configuration for frontend
    """
    client_id = os.environ.get('GOOGLE_OAUTH2_CLIENT_ID', '')
    
    if not client_id:
        return Response(
            {'error': 'Google OAuth2 not configured'}, 
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    return Response({
        'client_id': client_id,
        'redirect_uri': request.build_absolute_uri('/auth/google/callback/')
    })
