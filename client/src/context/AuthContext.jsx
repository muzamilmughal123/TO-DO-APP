import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize and load user profile on mount if token exists
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data && res.data.success) {
            setUser(res.data.data.user);
          }
        } catch (error) {
          console.error('Initial user fetch failed:', error);
          // Token is likely invalid or expired (handled by interceptor)
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Register action
  const registerUser = async (name, email, password, role) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      if (res.data && res.data.success) {
        const { user: userData, accessToken, refreshToken } = res.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        setUser(userData);
        return { success: true, message: res.data.message };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (error) {
      console.error('Registration failed:', error);
      const msg = error.response?.data?.message || 'Failed to complete registration';
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  // Login action
  const loginUser = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data && res.data.success) {
        const { user: userData, accessToken, refreshToken } = res.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        setUser(userData);
        return { success: true, message: res.data.message };
      }
      return { success: false, message: 'Authentication failed' };
    } catch (error) {
      console.error('Login failed:', error);
      const msg = error.response?.data?.message || 'Invalid email or password';
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  // Google Login action (simulated/mocked payload or handled dynamically)
  const googleLogin = async (googlePayload) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/google', googlePayload);
      if (res.data && res.data.success) {
        const { user: userData, accessToken, refreshToken } = res.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        setUser(userData);
        return { success: true, message: res.data.message };
      }
      return { success: false, message: 'Google Authentication failed' };
    } catch (error) {
      console.error('Google login error:', error);
      const msg = error.response?.data?.message || 'Google Auth Connection failed';
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  // Logout action
  const logoutUser = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        registerUser,
        loginUser,
        googleLogin,
        logoutUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
