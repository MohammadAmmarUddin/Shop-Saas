const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const gatewayController = require('../controllers/paymentGatewayController');
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.use(authenticate);
router.use(authorize('super_admin'));

router.get('/', asyncHandler(tenantController.listTenants));
router.get('/stats', asyncHandler(tenantController.getTenantStats));
router.post('/', asyncHandler(tenantController.createTenant));

router.get('/payments', asyncHandler(tenantController.listManualPayments));
router.patch('/payments/:id', asyncHandler(tenantController.approveManualPayment));

router.get('/gateways', asyncHandler(gatewayController.listGateways));
router.put('/gateways/:id', asyncHandler(gatewayController.updateGateway));

router.get('/:id', asyncHandler(tenantController.getTenant));
router.put('/:id', asyncHandler(tenantController.updateTenant));
router.patch('/:id/status', asyncHandler(tenantController.updateTenantStatus));
router.post('/:id/change-plan', asyncHandler(tenantController.changeTenantPlan));
router.post('/:id/suspend', asyncHandler(tenantController.suspendTenant));
router.post('/:id/activate', asyncHandler(tenantController.activateTenant));
router.delete('/:id', asyncHandler(tenantController.deleteTenant));

module.exports = router;
