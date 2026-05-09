const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.use(authenticate);

router.get('/stats', asyncHandler(dashboardController.getDashboardStats));
router.get('/charts', asyncHandler(dashboardController.getChartData));
router.get('/activity', asyncHandler(dashboardController.getRecentActivity));

module.exports = router;
