const reportService = require('../services/reportService');
const response = require('../utils/response');

const getSalesReport = async (req, res, next) => {
  try {
    const { start_date, end_date, group_by, category_id, customer_id, payment_method } = req.query;
    const result = await reportService.getSalesReport(req.tenantId, {
      startDate: start_date,
      endDate: end_date,
      groupBy: group_by || 'day',
      categoryId: category_id,
      customerId: customer_id,
      paymentMethod: payment_method,
    });
    response.success(res, result);
  } catch (error) {
    next(error);
  }
};

const getPurchaseReport = async (req, res, next) => {
  try {
    const { start_date, end_date, group_by, supplier_id, status } = req.query;
    const result = await reportService.getPurchaseReport(req.tenantId, {
      startDate: start_date,
      endDate: end_date,
      groupBy: group_by || 'day',
      supplierId: supplier_id,
      status,
    });
    response.success(res, result);
  } catch (error) {
    next(error);
  }
};

const getProfitLossReport = async (req, res, next) => {
  try {
    const { start_date, end_date, group_by } = req.query;
    const result = await reportService.getProfitLossReport(req.tenantId, {
      startDate: start_date,
      endDate: end_date,
      groupBy: group_by || 'month',
    });
    response.success(res, result);
  } catch (error) {
    next(error);
  }
};

const getInventoryReport = async (req, res, next) => {
  try {
    const result = await reportService.getInventoryReport(req.tenantId);
    response.success(res, result);
  } catch (error) {
    next(error);
  }
};

const getTopSellingProducts = async (req, res, next) => {
  try {
    const { start_date, end_date, limit } = req.query;
    const result = await reportService.getTopSellingProducts(req.tenantId, {
      startDate: start_date,
      endDate: end_date,
      limit: parseInt(limit) || 10,
    });
    response.success(res, result);
  } catch (error) {
    next(error);
  }
};

const getCustomerReport = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    const result = await reportService.getCustomerReport(req.tenantId, {
      startDate: start_date,
      endDate: end_date,
    });
    response.success(res, result);
  } catch (error) {
    next(error);
  }
};

const getExpenseReport = async (req, res, next) => {
  try {
    const { start_date, end_date, group_by } = req.query;
    const result = await reportService.getExpenseReport(req.tenantId, {
      startDate: start_date,
      endDate: end_date,
      groupBy: group_by || 'category',
    });
    response.success(res, result);
  } catch (error) {
    next(error);
  }
};

const exportReport = async (req, res, next) => {
  try {
    const { type, format = 'json', start_date, end_date } = req.query;
    if (!type) return response.error(res, 'Report type is required', 400);

    let data;
    switch (type) {
      case 'sales':
        data = await reportService.getSalesReport(req.tenantId, { startDate: start_date, endDate: end_date });
        break;
      case 'profit_loss':
        data = await reportService.getProfitLossReport(req.tenantId, { startDate: start_date, endDate: end_date });
        break;
      case 'inventory':
        data = await reportService.getInventoryReport(req.tenantId);
        break;
      case 'expenses':
        data = await reportService.getExpenseReport(req.tenantId, { startDate: start_date, endDate: end_date });
        break;
      default:
        return response.error(res, 'Invalid report type', 400);
    }

    if (format === 'csv') {
      const items = data.breakdown || data.products || [];
      const headers = items.length > 0 ? Object.keys(items[0]) : [];
      const csvLines = [headers.join(','), ...items.map(item => headers.map(h => `"${item[h] || ''}"`).join(','))];
      const csv = csvLines.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}_report.csv`);
      return res.send(csv);
    }

    response.success(res, data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSalesReport,
  getPurchaseReport,
  getProfitLossReport,
  getInventoryReport,
  getTopSellingProducts,
  getCustomerReport,
  getExpenseReport,
  exportReport,
};
