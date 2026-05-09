import api from './api';

export const backupService = {
  getAll: (params) => api.get('/backup', { params }),
  create: () => api.post('/backup'),
  download: (id) => api.get(`/backup/${id}/download`, {
    responseType: 'blob',
  }),
  restore: (id) => api.post(`/backup/${id}/restore`),
  delete: (id) => api.delete(`/backup/${id}`),
};
