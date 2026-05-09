import api from './api';

export const storeService = {
  getCurrent: () => api.get('/stores'),
  update: (data) => api.put('/stores', data),
  uploadLogo: (formData) => api.put('/stores', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getSettings: () => api.get('/stores/settings'),
  updateSettings: (data) => api.put('/stores/settings', data),
};
