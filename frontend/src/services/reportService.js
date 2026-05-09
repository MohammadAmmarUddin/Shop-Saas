import api from './api';

export const reportService = {
  getSalesReport: (params) => api.get('/reports/sales', { params }),
  getPurchasesReport: (params) => api.get('/reports/purchases', { params }),
  getProfitLoss: (params) => api.get('/reports/profit-loss', { params }),
  getInventoryReport: (params) => api.get('/reports/inventory', { params }),
  getCustomerReport: (params) => api.get('/reports/customers', { params }),
  getExpenseReport: (params) => api.get('/reports/expenses', { params }),
  getTopProducts: (params) => api.get('/reports/top-products', { params }),
  exportReport: (params) => api.get('/reports/export', {
    params,
    responseType: 'blob',
  }),
};
