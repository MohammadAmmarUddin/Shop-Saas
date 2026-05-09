import { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const setTokens = (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  };

  const clearTokens = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  const getAccessToken = () => localStorage.getItem('accessToken');
  const getRefreshToken = () => localStorage.getItem('refreshToken');

  const loadUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data || res.data);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (credentials) => {
    setError(null);
    try {
      const res = await api.post('/auth/login', credentials);
      const { user: userData, tokens } = res.data.data || res.data;
      const { accessToken, refreshToken } = tokens || {};
      setTokens(accessToken, refreshToken);
      setUser(userData);
      return userData;
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || 'Login failed';
      setError(message);
      throw new Error(message);
    }
  };

  const register = async (data) => {
    setError(null);
    try {
      const res = await api.post('/auth/register', data);
      const { user: userData, tokens } = res.data.data || res.data;
      const { accessToken, refreshToken } = tokens || {};
      setTokens(accessToken, refreshToken);
      setUser(userData);
      return userData;
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || 'Registration failed';
      setError(message);
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
    } finally {
      clearTokens();
      setUser(null);
    }
  };

  const refreshToken = async () => {
    const token = getRefreshToken();
    if (!token) throw new Error('No refresh token');
    try {
      const res = await api.post('/auth/refresh', { refresh_token: token });
      const { tokens } = res.data.data || res.data;
      const { accessToken, refreshToken: newRefreshToken } = tokens || {};
      setTokens(accessToken, newRefreshToken);
      return accessToken;
    } catch {
      clearTokens();
      setUser(null);
      throw new Error('Session expired');
    }
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (typeof roles === 'string') return user.role === roles;
    return roles.includes(user.role);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{
      user, loading, error, login, register, logout,
      getAccessToken, refreshToken, loadUser,
      hasRole, clearError, setUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};
