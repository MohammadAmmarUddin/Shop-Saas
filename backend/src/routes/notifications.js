const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.use(authenticate);

router.get('/', asyncHandler(notificationController.listNotifications));
router.get('/unread-count', asyncHandler(notificationController.getUnreadCount));
router.delete('/', asyncHandler(notificationController.clearAllNotifications));
router.put('/:id/read', asyncHandler(notificationController.markAsRead));
router.put('/read-all', asyncHandler(notificationController.markAllAsRead));
router.delete('/:id', asyncHandler(notificationController.deleteNotification));

module.exports = router;
