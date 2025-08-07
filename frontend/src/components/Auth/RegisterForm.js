import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import GoogleSignIn from '../GoogleSignIn';
import './Auth.css';

const RegisterForm = ({ onClose, switchToLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    user_type: 'creator' // creator, client, freelancer
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const { register, login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const userData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      first_name: formData.first_name,
      last_name: formData.last_name,
      user_type: formData.user_type
    };

    const result = await register(userData);
    
    if (result.success) {
      // Show email verification message instead of auto-login
      setRegisteredEmail(formData.email);
      setShowVerificationMessage(true);
      setError('');
    } else {
      setError(typeof result.error === 'string' ? result.error : 'Registration failed');
    }
    
    setLoading(false);
  };

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api/'}/api/users/resend_verification/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: registeredEmail }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Verification email sent successfully! Please check your inbox.');
      } else {
        setError(data.error || 'Failed to resend verification email');
      }
    } catch (err) {
      console.error('Error resending verification:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (googleData) => {
    console.log('Google sign-up successful in modal:', googleData);
    setError('');
    // For Google sign-up, the user is already created and logged in
    onClose(); // Close the modal after successful Google signup
  };

  const handleGoogleError = (errorMessage) => {
    console.error('Google sign-up error in modal:', errorMessage);
    setError(errorMessage || 'Google sign-up failed. Please try again.');
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-header">
          <h2>{showVerificationMessage ? 'Check Your Email' : 'Join VikraHub'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        {showVerificationMessage ? (
          <div className="verification-message">
            <div className="verification-icon">📧</div>
            <h3>Verify Your Email Address</h3>
            <p>
              We've sent a verification email to <strong>{registeredEmail}</strong>. 
              Please check your inbox and click the verification link to activate your account.
            </p>
            <div className="verification-notes">
              <p><strong>Don't see the email?</strong></p>
              <ul>
                <li>Check your spam/junk folder</li>
                <li>Make sure you entered the correct email address</li>
                <li>The email may take a few minutes to arrive</li>
              </ul>
            </div>
            <div className="verification-actions">
              <button 
                onClick={handleResendVerification}
                disabled={loading}
                className="auth-btn secondary"
              >
                {loading ? 'Sending...' : 'Resend Verification Email'}
              </button>
              <button 
                onClick={switchToLogin}
                className="auth-btn"
              >
                Go to Login
              </button>
            </div>
            {error && <div className="error-message">{error}</div>}
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="auth-form">
              {error && <div className="error-message">{error}</div>}
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">First Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="last_name">Last Name</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              autoComplete="username"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="user_type">Account Type</label>
            <select
              id="user_type"
              name="user_type"
              value={formData.user_type}
              onChange={handleChange}
              required
            >
              <option value="creator">Creator</option>
              <option value="client">Client</option>
              <option value="freelancer">Freelancer</option>
            </select>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </div>
          </div>
          
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        {/* Divider */}
        <div className="auth-divider">
          <span>OR</span>
        </div>
        
        {/* Google Sign-In */}
        <GoogleSignIn 
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
        />
        
        <div className="auth-footer">
          <p>Already have an account? 
            <button onClick={switchToLogin} className="link-btn">
              Sign in here
            </button>
          </p>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default RegisterForm;
