const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.use(authenticate);

router.get('/', asyncHandler(paymentController.listPayments));
router.get('/:id', asyncHandler(paymentController.getPayment));
router.post('/', asyncHandler(paymentController.createPayment));
router.put('/:id', asyncHandler(paymentController.updatePayment));
router.delete('/:id', asyncHandler(paymentController.deletePayment));

module.exports = router;
