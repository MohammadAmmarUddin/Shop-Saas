const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.use(authenticate);

router.get('/', asyncHandler(userController.listUsers));
router.get('/:id', asyncHandler(userController.getUser));
router.post('/', authorize('super_admin', 'store_owner', 'manager'), asyncHandler(userController.createUser));
router.put('/:id', authorize('super_admin', 'store_owner'), asyncHandler(userController.updateUser));
router.delete('/:id', authorize('super_admin', 'store_owner'), asyncHandler(userController.deleteUser));

module.exports = router;
