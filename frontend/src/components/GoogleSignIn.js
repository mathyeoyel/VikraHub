import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from './Auth/AuthContext';
import api from '../api';

const GoogleSignIn = ({ onSuccess, onError }) => {
  const googleButtonRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    // Load Google Identity Services
    if (window.google && window.google.accounts) {
      initializeGoogleSignIn();
    } else {
      // Wait for the script to load
      const checkGoogle = setInterval(() => {
        if (window.google && window.google.accounts) {
          clearInterval(checkGoogle);
          initializeGoogleSignIn();
        }
      }, 100);

      // Cleanup interval after 10 seconds
      setTimeout(() => clearInterval(checkGoogle), 10000);
    }
  }, []);

  const initializeGoogleSignIn = async () => {
    try {
      // Get Google OAuth config from backend
      const response = await api.get('auth/google/config/');
      const config = response.data;
      
      if (!config.client_id) {
        console.error('Google OAuth not configured on backend');
        return;
      }

      // Initialize Google Sign-In
      window.google.accounts.id.initialize({
        client_id: config.client_id,
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Render the Google Sign-In button
      if (googleButtonRef.current) {
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: 'standard',
          shape: 'rectangular',
          theme: 'outline',
          text: 'signin_with',
          size: 'large',
          logo_alignment: 'left',
          width: '300',
        });
      }
    } catch (error) {
      console.error('Failed to initialize Google Sign-In:', error);
      if (onError) onError('Failed to initialize Google Sign-In');
    }
  };

  const handleGoogleResponse = async (response) => {
    setIsLoading(true);
    
    try {
      // Send the Google ID token to our backend
      const backendResponse = await api.post('auth/google/', {
        id_token: response.credential,
      });

      const data = backendResponse.data;

      if (data.success) {
        // Update the auth context with the authenticated user
        const result = await login({
          accessToken: data.tokens.access,
          refreshToken: data.tokens.refresh,
          user: data.user,
          googleAuth: true,
        });

        if (result.success && onSuccess) {
          onSuccess({
            user: data.user,
            tokens: data.tokens,
            created: data.created,
          });
        }
      } else {
        console.error('Google authentication failed:', data.error);
        if (onError) onError(data.error || 'Google authentication failed');
      }
    } catch (error) {
      console.error('Google authentication error:', error);
      if (onError) onError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', margin: '20px 0' }}>
      <div 
        ref={googleButtonRef}
        style={{ 
          display: 'inline-block',
          opacity: isLoading ? 0.6 : 1,
          pointerEvents: isLoading ? 'none' : 'auto',
        }}
      />
      {isLoading && (
        <div style={{ 
          marginTop: '10px', 
          fontSize: '14px', 
          color: '#666' 
        }}>
          Signing in with Google...
        </div>
      )}
    </div>
  );
};

export default GoogleSignIn;
