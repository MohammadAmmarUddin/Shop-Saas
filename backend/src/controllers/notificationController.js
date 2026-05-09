const notificationService = require('../services/notificationService');
const response = require('../utils/response');

const listNotifications = async (req, res, next) => {
  try {
    const { page, limit, type, is_read } = req.query;
    const result = await notificationService.getNotifications(req.tenantId, {
      userId: req.user.id,
      type,
      isRead: is_read !== undefined ? (is_read === 'true' || is_read === '1') : undefined,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    response.success(res, result);
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.tenantId);
    response.success(res, notification, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.tenantId, req.user.id);
    response.success(res, null, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

const clearAllNotifications = async (req, res, next) => {
  try {
    await notificationService.clearNotifications(req.tenantId, req.user.id);
    response.success(res, null, 'Notifications cleared');
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    await notificationService.deleteNotification(req.params.id, req.tenantId);
    response.success(res, null, 'Notification deleted');
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.tenantId, req.user.id);
    response.success(res, { count, unread_count: count });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listNotifications,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
  deleteNotification,
  getUnreadCount,
};
