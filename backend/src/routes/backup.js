const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.use(authenticate);

router.get('/', asyncHandler(backupController.listBackups));
router.post('/', asyncHandler(backupController.createBackup));
router.get('/:id', asyncHandler(backupController.getBackup));
router.get('/:id/download', asyncHandler(backupController.downloadBackup));
router.post('/:id/restore', authorize('super_admin'), asyncHandler(backupController.restoreBackup));
router.delete('/:id', asyncHandler(backupController.deleteBackup));

module.exports = router;
