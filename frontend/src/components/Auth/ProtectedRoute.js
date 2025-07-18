import React from 'react';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children, requireAuth = true, requireStaff = false, requireSuperuser = false, fallback = null }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return fallback || (
      <div className="protected-message">
        <h2>Authentication Required</h2>
        <p>Please log in to access this feature.</p>
        <button 
          className="btn btn-primary"
          onClick={() => window.location.href = '/login'}
        >
          Sign In
        </button>
      </div>
    );
  }

  // Check staff permission if required
  if (requireStaff && (!user || (!user.is_staff && !user.is_superuser))) {
    return (
      <div className="protected-message">
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page.</p>
        <p>Staff access is required.</p>
        <button 
          className="btn btn-primary"
          onClick={() => window.location.href = '/'}
        >
          Go Home
        </button>
      </div>
    );
  }

  // Check superuser permission if required
  if (requireSuperuser && (!user || !user.is_superuser)) {
    return (
      <div className="protected-message">
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page.</p>
        <p>Administrator access is required.</p>
        <button 
          className="btn btn-primary"
          onClick={() => window.location.href = '/'}
        >
          Go Home
        </button>
      </div>
    );
  }

  if (!requireAuth && isAuthenticated) {
    return fallback || (
      <div className="protected-message">
        <h2>Already Logged In</h2>
        <p>You are already signed in.</p>
        <button 
          className="btn btn-primary"
          onClick={() => window.location.href = '/dashboard'}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
