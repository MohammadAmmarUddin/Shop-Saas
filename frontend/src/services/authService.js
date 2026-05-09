import api from './api';

export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  refresh: (token) => api.post('/auth/refresh', { refreshToken: token }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};
