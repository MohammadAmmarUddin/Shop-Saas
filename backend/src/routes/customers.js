const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.use(authenticate);

router.get('/', asyncHandler(customerController.listCustomers));
router.get('/:id', asyncHandler(customerController.getCustomer));
router.post('/', asyncHandler(customerController.createCustomer));
router.put('/:id', asyncHandler(customerController.updateCustomer));
router.delete('/:id', asyncHandler(customerController.deleteCustomer));

module.exports = router;
