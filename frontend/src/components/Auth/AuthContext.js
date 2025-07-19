import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../../api';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('access'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Fetch user data
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async (accessToken = null) => {
    const tokenToUse = accessToken || token;
    if (!tokenToUse) return;
    
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'https://vikrahub.onrender.com/api/';
      console.log('Fetching user from:', `${apiUrl}users/me/`);
      
      const response = await axios.get(`${apiUrl}users/me/`, {
        headers: {
          'Authorization': `Bearer ${tokenToUse}`,
          'Content-Type': 'application/json'
        }
      });
      setUser(response.data);
      console.log('User fetched successfully:', response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Only logout if it's an authentication error, not a network error
      if (error.response?.status === 401 || error.response?.status === 403) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      console.log('AuthContext login called with:', credentials);
      const response = await authAPI.login(credentials);
      console.log('AuthAPI response:', response);
      
      const { access, refresh } = response.data;
      
      localStorage.setItem('access', access);
      localStorage.setItem('refresh', refresh);
      setToken(access);
      
      await fetchUser(access); // Pass the access token directly
      return { success: true };
    } catch (error) {
      console.error('AuthContext login error:', error);
      console.error('Error response:', error.response);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'Registration failed';
      
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.non_field_errors) {
          errorMessage = error.response.data.non_field_errors[0];
        } else {
          // Handle field-specific errors
          const errors = [];
          Object.keys(error.response.data).forEach(field => {
            if (Array.isArray(error.response.data[field])) {
              errors.push(`${field}: ${error.response.data[field][0]}`);
            }
          });
          if (errors.length > 0) {
            errorMessage = errors.join(', ');
          }
        }
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    setToken(null);
    setUser(null);
  };

  const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem('refresh');
      if (!refresh) throw new Error('No refresh token');

      const response = await authAPI.refresh(refresh);
      const { access } = response.data;
      
      localStorage.setItem('access', access);
      setToken(access);
      
      return access;
    } catch (error) {
      logout();
      throw error;
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    refreshToken,
    isAuthenticated: !!token && !!user,
    isFreelancer: user?.freelancer_profile ? true : false,
    isSeller: user?.assets?.length > 0
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
