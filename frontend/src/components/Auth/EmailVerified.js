import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Auth.css';

const EmailVerified = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const status = searchParams.get('status');
    const msg = searchParams.get('message');
    
    if (status === 'success') {
      setVerificationStatus('success');
      setMessage(msg || 'Your email has been verified successfully! You can now log in to your account.');
    } else if (status === 'error') {
      setVerificationStatus('error');
      setMessage(msg || 'There was an error verifying your email. Please try again.');
    } else if (status === 'expired') {
      setVerificationStatus('expired');
      setMessage(msg || 'This verification link has expired. Please request a new verification email.');
    } else if (status === 'already_verified') {
      setVerificationStatus('already_verified');
      setMessage(msg || 'Your email has already been verified. You can log in to your account.');
    } else {
      setVerificationStatus('error');
      setMessage('Invalid verification link.');
    }
  }, [searchParams]);

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (verificationStatus === 'loading') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="verification-message">
            <div className="verification-icon">⏳</div>
            <h2>Verifying...</h2>
            <p>Please wait while we verify your email.</p>
          </div>
        </div>
      </div>
    );
  }

  const getIcon = () => {
    switch (verificationStatus) {
      case 'success':
        return '🎉';
      case 'already_verified':
        return '✅';
      case 'expired':
        return '⏰';
      case 'error':
      default:
        return '❌';
    }
  };

  const getTitle = () => {
    switch (verificationStatus) {
      case 'success':
        return 'Email Verified!';
      case 'already_verified':
        return 'Already Verified';
      case 'expired':
        return 'Link Expired';
      case 'error':
      default:
        return 'Verification Failed';
    }
  };

  const isSuccess = verificationStatus === 'success' || verificationStatus === 'already_verified';

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="verification-message">
          <div className="verification-icon">{getIcon()}</div>
          <h2>{getTitle()}</h2>
          <p>{message}</p>

          <div className="verification-actions">
            {isSuccess ? (
              <button 
                onClick={handleGoToLogin}
                className="auth-button primary"
                type="button"
              >
                Continue to Login
              </button>
            ) : (
              <div className="button-group">
                <button 
                  onClick={handleGoHome}
                  className="auth-button secondary"
                  type="button"
                >
                  Go to Homepage
                </button>
                {verificationStatus === 'expired' && (
                  <button 
                    onClick={() => navigate('/signup')}
                    className="auth-button primary"
                    type="button"
                  >
                    Request New Link
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="verification-notes">
            <p><strong>Next Steps:</strong></p>
            <ul>
              {isSuccess ? (
                <>
                  <li>Your account is now active and ready to use</li>
                  <li>You can log in with your email and password</li>
                  <li>Welcome to the VikraHub community!</li>
                </>
              ) : (
                <>
                  <li>Check your email for a fresh verification link</li>
                  <li>Make sure to click the link within 24 hours</li>
                  <li>Contact support if you continue to have issues</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerified;
