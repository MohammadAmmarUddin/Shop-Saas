const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createProductSchema, updateProductSchema } = require('../validators/productValidator');
const asyncHandler = require('../utils/asyncHandler');

router.use(authenticate);

router.get('/', asyncHandler(productController.listProducts));
router.get('/barcode/:barcode', asyncHandler(productController.getProductByBarcode));
router.get('/:id', asyncHandler(productController.getProduct));
router.post('/', validate(createProductSchema), asyncHandler(productController.createProduct));
router.put('/:id', validate(updateProductSchema), asyncHandler(productController.updateProduct));
router.delete('/:id', asyncHandler(productController.deleteProduct));
router.patch('/:id/stock', asyncHandler(productController.adjustStock));
router.post('/bulk-update', asyncHandler(productController.bulkUpdateProducts));

module.exports = router;
