import React, { createContext, useState, useContext, useEffect } from 'react';
import httpClient from '../api/httpClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('studyhub_token'));

  useEffect(() => {
    // Check if redirect is needed due to 401/403
    if (sessionStorage.getItem('auth_redirect_needed') === 'true') {
      sessionStorage.removeItem('auth_redirect_needed');
      setCurrentUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    if (token) {
      getCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const getCurrentUser = async () => {
    try {
      const response = await httpClient.get('/auth/me');
      const data = response.data;
      if (data.success) {
        setCurrentUser(data.user);
      } else {
        localStorage.removeItem('studyhub_token');
        setToken(null);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
      localStorage.removeItem('studyhub_token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      const response = await httpClient.post('/auth/register', userData);
      const data = response.data;
      if (data.success) {
        localStorage.setItem('studyhub_token', data.token);
        setToken(data.token);
        setCurrentUser(data.user);
        return { success: true, data };
      } else {
        return { 
          success: false, 
          error: data.message || 'Registration failed',
          errors: data.errors 
        };
      }
    } catch (error) {
      if (error.response) {
        const data = error.response.data;
        let errorMessage = data.message || 'Registration failed';
        if (data.errors && Array.isArray(data.errors)) {
          errorMessage += ': ' + data.errors.map(e => e.msg).join(', ');
        }
        return { 
          success: false, 
          error: errorMessage,
          errors: data.errors 
        };
      } else if (error.message === 'Network Error') {
        return { 
          success: false, 
          error: 'Network error. Please check your connection and try again.' 
        };
      } else {
        return { 
          success: false, 
          error: 'An unexpected error occurred.' 
        };
      }
    }
  };

  const login = async (email, password) => {
    try {
      const response = await httpClient.post('/auth/login', { email, password });
      const data = response.data;
      if (data.success) {
        localStorage.setItem('studyhub_token', data.token);
        setToken(data.token);
        setCurrentUser(data.user);
        return { success: true, data };
      } else {
        return { 
          success: false, 
          error: data.message || 'Login failed',
          errors: data.errors 
        };
      }
    } catch (error) {
      if (error.response) {
        const data = error.response.data;
        let errorMessage = data.message || 'Login failed';
        if (data.errors && Array.isArray(data.errors)) {
          errorMessage += ': ' + data.errors.map(e => e.msg).join(', ');
        }
        return { 
          success: false, 
          error: errorMessage,
          errors: data.errors 
        };
      } else if (error.message === 'Network Error') {
        return { 
          success: false, 
          error: 'Network error. Please check your connection and try again.' 
        };
      } else {
        return { 
          success: false, 
          error: 'An unexpected error occurred.' 
        };
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('studyhub_token');
    setToken(null);
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    token,
    register,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};