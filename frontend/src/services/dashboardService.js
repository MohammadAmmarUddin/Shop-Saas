import api from './api';

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getCharts: (period) => api.get('/dashboard/charts', { params: { period } }),
  getActivity: (limit) => api.get('/dashboard/activity', { params: { limit } }),
};
