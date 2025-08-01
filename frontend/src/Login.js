import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './components/Auth/AuthContext';
import GoogleSignIn from './components/GoogleSignIn';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    console.log('Login attempt with:', { username, password });
    
    try {
      const result = await login({ username, password });
      console.log('Login result:', result);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        console.error('Login failed with result:', result);
        setError(result.error || 'Login failed. Check your credentials.');
      }
    } catch (err) {
      console.error('Login exception:', err);
      setError('Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (googleData) => {
    console.log('Google sign-in successful:', googleData);
    if (googleData.created) {
      setError('');
      // New user created, redirect to dashboard
      navigate('/dashboard');
    } else {
      setError('');
      // Existing user, redirect to dashboard
      navigate('/dashboard');
    }
  };

  const handleGoogleError = (errorMessage) => {
    console.error('Google sign-in error:', errorMessage);
    setError(errorMessage || 'Google sign-in failed. Please try again.');
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }}>
      <h2>Login to VikraHub</h2>
      {error && <div style={{color: "red", marginBottom: "15px"}}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
      
      {/* Divider */}
      <div style={{ 
        margin: '20px 0', 
        textAlign: 'center', 
        borderBottom: '1px solid #ddd', 
        lineHeight: '0.1em' 
      }}>
        <span style={{ 
          background: '#fff', 
          padding: '0 10px', 
          color: '#666' 
        }}>
          OR
        </span>
      </div>
      
      {/* Google Sign-In */}
      <GoogleSignIn 
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
      />
      
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <p>Don't have an account? <Link to="/">Sign up using the modal</Link></p>
      </div>
    </div>
  );
}

export default Login;
