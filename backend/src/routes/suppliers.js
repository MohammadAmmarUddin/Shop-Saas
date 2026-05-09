const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.use(authenticate);

router.get('/', asyncHandler(supplierController.listSuppliers));
router.get('/:id', asyncHandler(supplierController.getSupplier));
router.post('/', asyncHandler(supplierController.createSupplier));
router.put('/:id', asyncHandler(supplierController.updateSupplier));
router.delete('/:id', asyncHandler(supplierController.deleteSupplier));

module.exports = router;
