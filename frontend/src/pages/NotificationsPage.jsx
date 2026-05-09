import { useState, useEffect, useCallback } from 'react';
import { FiBell, FiCheck, FiCheckCircle, FiTrash2, FiInfo, FiAlertTriangle, FiShoppingCart, FiPackage, FiDollarSign, FiUser } from 'react-icons/fi';
import { toast } from '../utils/swal';
import { notificationService } from '../services/notificationService';
import { timeAgo } from '../utils/helpers';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';

const iconMap = {
  info: FiInfo,
  warning: FiAlertTriangle,
  sale: FiShoppingCart,
  product: FiPackage,
  payment: FiDollarSign,
  customer: FiUser,
};

const colorMap = {
  info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  warning: 'bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400',
  sale: 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400',
  product: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
  payment: 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400',
  customer: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
};

const normalizeNotification = (notification) => ({
  ...notification,
  id: notification.id,
  read: notification.read ?? notification.is_read ?? false,
  createdAt: notification.createdAt || notification.created_at,
});

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationService.getAll({ limit: 50 });
      const payload = res.data?.data || res.data || {};
      const rows = Array.isArray(payload.notifications) ? payload.notifications : Array.isArray(payload) ? payload : [];
      setNotifications(rows.map(normalizeNotification));
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n._id || n.id) === id ? { ...n, read: true, is_read: true } : n));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, is_read: true })));
      toast.success('All notifications marked as read');
    } catch { toast.error('Failed to mark all as read'); }
  };

  const clearAll = async () => {
    setClearing(true);
    try {
      await notificationService.clearAll();
      setNotifications([]);
      toast.success('All notifications cleared');
      setShowClearDialog(false);
    } catch { toast.error('Failed to clear notifications'); }
    finally { setClearing(false); }
  };

  const getIcon = (type) => {
    const Icon = iconMap[type] || FiBell;
    return Icon;
  };

  const getColor = (type) => {
    return colorMap[type] || colorMap.info;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) return <div className="page-container"><LoadingSpinner fullPage /></div>;

  return (
    <div className="page-container max-w-3xl">
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
        breadcrumbs={[{ label: 'System' }, { label: 'Notifications' }]}
        actions={
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="secondary" size="sm" icon={FiCheckCircle} onClick={markAllAsRead}>
                Mark All Read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="danger" size="sm" icon={FiTrash2} onClick={() => setShowClearDialog(true)}>
                Clear All
              </Button>
            )}
          </div>
        }
      />

      <Card>
        {notifications.length === 0 ? (
          <EmptyState icon={FiBell} title="No notifications" message="You're all caught up!" />
        ) : (
          <div className="divide-y divide-secondary-200 dark:divide-secondary-700">
            {notifications.map((notification) => {
              const id = notification._id || notification.id;
              const Icon = getIcon(notification.type);
              return (
                <div
                  key={id}
                  className={`flex items-start gap-4 p-4 transition-colors ${!notification.read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''} hover:bg-secondary-50 dark:hover:bg-secondary-700/30`}
                  onClick={() => !notification.read && markAsRead(id)}
                >
                  <div className={`p-2 rounded-xl flex-shrink-0 ${getColor(notification.type)}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`text-sm ${!notification.read ? 'font-semibold text-secondary-900 dark:text-white' : 'text-secondary-600 dark:text-secondary-400'}`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-secondary-500 dark:text-secondary-500 mt-0.5">{notification.message}</p>
                      </div>
                      <span className="text-xs text-secondary-400 whitespace-nowrap flex-shrink-0">{timeAgo(notification.createdAt)}</span>
                    </div>
                    {!notification.read && (
                      <div className="mt-2 flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); markAsRead(id); }} className="text-xs text-primary-600 hover:text-primary-500 font-medium">Mark as read</button>
                      </div>
                    )}
                  </div>
                  {!notification.read && <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-2" />}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <ConfirmDialog
        isOpen={showClearDialog}
        onClose={() => setShowClearDialog(false)}
        onConfirm={clearAll}
        loading={clearing}
        title="Clear All Notifications"
        message="Are you sure you want to delete all notifications? This action cannot be undone."
        confirmLabel="Clear All"
        variant="danger"
      />
    </div>
  );
};

export default NotificationsPage;
