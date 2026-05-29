const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.use(authenticate);

router.get('/', asyncHandler(subscriptionController.getSubscription));
router.get('/plans', asyncHandler(subscriptionController.getPlans));
router.get('/status', asyncHandler(subscriptionController.getSubscriptionStatus));
router.post('/subscribe', asyncHandler(subscriptionController.subscribe));
router.post('/cancel', asyncHandler(subscriptionController.cancelSubscription));

router.get('/payment-methods', asyncHandler(subscriptionController.getPaymentMethods));
router.post('/manual-payment', asyncHandler(subscriptionController.submitManualPayment));
router.get('/payments', asyncHandler(subscriptionController.getPaymentHistory));

module.exports = router;
