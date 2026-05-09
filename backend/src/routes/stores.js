const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.use(authenticate);

router.get('/', asyncHandler(storeController.getStore));
router.get('/current', asyncHandler(storeController.getStore));
router.put('/', asyncHandler(storeController.updateStore));
router.get('/settings', asyncHandler(storeController.getStoreSettings));
router.put('/settings', asyncHandler(storeController.updateStoreSettings));
router.get('/limits', asyncHandler(storeController.checkLimits));

module.exports = router;
