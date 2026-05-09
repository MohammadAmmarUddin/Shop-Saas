const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.use(authenticate);

router.get('/sales', asyncHandler(reportController.getSalesReport));
router.get('/purchases', asyncHandler(reportController.getPurchaseReport));
router.get('/profit-loss', asyncHandler(reportController.getProfitLossReport));
router.get('/inventory', asyncHandler(reportController.getInventoryReport));
router.get('/top-products', asyncHandler(reportController.getTopSellingProducts));
router.get('/customers', asyncHandler(reportController.getCustomerReport));
router.get('/expenses', asyncHandler(reportController.getExpenseReport));
router.get('/export', asyncHandler(reportController.exportReport));

module.exports = router;
