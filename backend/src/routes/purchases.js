const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createPurchaseSchema, updatePurchaseSchema, receivePurchaseSchema } = require('../validators/purchaseValidator');
const asyncHandler = require('../utils/asyncHandler');

router.use(authenticate);

router.get('/', asyncHandler(purchaseController.listPurchases));
router.get('/:id', asyncHandler(purchaseController.getPurchase));
router.post('/', validate(createPurchaseSchema), asyncHandler(purchaseController.createPurchase));
router.put('/:id', validate(updatePurchaseSchema), asyncHandler(purchaseController.updatePurchase));
router.post('/:id/receive', validate(receivePurchaseSchema), asyncHandler(purchaseController.receivePurchase));
router.delete('/:id', asyncHandler(purchaseController.deletePurchase));

module.exports = router;
