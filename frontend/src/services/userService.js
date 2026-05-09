import api from './api';

export const userService = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  updateStatus: (id, status) => api.put(`/users/${id}`, { status }),
  changePassword: (data) => api.put('/auth/change-password', {
    current_password: data.current_password || data.currentPassword,
    new_password: data.new_password || data.newPassword,
  }),
};
