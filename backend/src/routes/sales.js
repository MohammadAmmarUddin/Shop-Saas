const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createSaleSchema, updateSaleSchema } = require('../validators/saleValidator');
const asyncHandler = require('../utils/asyncHandler');

router.use(authenticate);

router.get('/', asyncHandler(saleController.listSales));
router.get('/:id', asyncHandler(saleController.getSale));
router.post('/', validate(createSaleSchema), asyncHandler(saleController.createSale));
router.put('/:id', validate(updateSaleSchema), asyncHandler(saleController.updateSale));
router.delete('/:id', asyncHandler(saleController.deleteSale));

module.exports = router;
