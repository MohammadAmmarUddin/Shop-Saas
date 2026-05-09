import api from './api';

export const tenantService = {
  getAll: (params) => api.get('/admin/tenants', { params }),
  getById: (id) => api.get(`/admin/tenants/${id}`),
  create: (data) => api.post('/admin/tenants', data),
  update: (id, data) => api.put(`/admin/tenants/${id}`, data),
  delete: (id) => api.delete(`/admin/tenants/${id}`),
  updateStatus: (id, status) => api.patch(`/admin/tenants/${id}/status`, { status }),
  changePlan: (id, planId) => api.post(`/admin/tenants/${id}/change-plan`, { planId }),
  getStats: () => api.get('/admin/tenants/stats'),
};
