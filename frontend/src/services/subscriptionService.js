import api from './api';

export const subscriptionService = {
  getCurrent: () => api.get('/subscriptions'),
  getPlans: () => api.get('/subscriptions/plans'),
  getStatus: () => api.get('/subscriptions/status'),
  subscribe: (data) => api.post('/subscriptions/subscribe', data),
  cancel: () => api.post('/subscriptions/cancel'),
};
