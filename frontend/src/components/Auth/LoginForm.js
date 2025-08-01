import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import GoogleSignIn from '../GoogleSignIn';
import './Auth.css';

const LoginForm = ({ onClose, switchToRegister }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

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

    const result = await login(formData);
    
    if (result.success) {
      onClose();
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleGoogleSuccess = (googleData) => {
    console.log('Google sign-in successful in modal:', googleData);
    setError('');
    onClose(); // Close the modal after successful Google login
  };

  const handleGoogleError = (errorMessage) => {
    console.error('Google sign-in error in modal:', errorMessage);
    setError(errorMessage || 'Google sign-in failed. Please try again.');
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          
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
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>
          
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
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
          <p>Don't have an account? 
            <button onClick={switchToRegister} className="link-btn">
              Sign up here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
