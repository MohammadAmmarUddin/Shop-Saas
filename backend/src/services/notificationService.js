const prisma = require('../prisma');
const { getIO } = require('../config/socket');

const createNotification = async ({ store_id, user_id, type, title, message, data = {} }) => {
  const notification = await prisma.notification.create({
    data: {
      store_id,
      user_id,
      type,
      title,
      message,
      data,
    },
  });

  try {
    const io = getIO();
    if (io) {
      if (user_id) {
        io.to(`user:${user_id}`).emit('notification', notification);
      }
      if (store_id) {
        io.to(`store:${store_id}`).emit('notification', notification);
      }
    }
  } catch (e) {}

  return notification;
};

const getNotifications = async (storeId, { userId, type, isRead, page = 1, limit = 20 }) => {
  const where = {};
  if (storeId) where.store_id = storeId;
  if (userId) where.user_id = userId;
  if (type) where.type = type;
  if (isRead !== undefined) where.is_read = isRead;

  const offset = (page - 1) * limit;
  const [count, rows] = await prisma.$transaction([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limit,
    }),
  ]);

  return {
    notifications: rows,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
    unreadCount: await prisma.notification.count({ where: { ...where, is_read: false } }),
  };
};

const markAsRead = async (notificationId, storeId) => {
  const where = { id: BigInt(notificationId) };
  if (storeId) where.store_id = storeId;

  const notification = await prisma.notification.findFirst({ where });
  if (!notification) throw new Error('Notification not found');

  await prisma.notification.update({
    where: { id: notification.id },
    data: { is_read: true, read_at: new Date() },
  });
  return notification;
};

const markAllAsRead = async (storeId, userId) => {
  const where = { is_read: false };
  if (storeId) where.store_id = storeId;
  if (userId) where.user_id = userId;

  await prisma.notification.updateMany({
    where,
    data: { is_read: true, read_at: new Date() },
  });

  return true;
};

const deleteNotification = async (notificationId, storeId) => {
  const where = { id: BigInt(notificationId) };
  if (storeId) where.store_id = storeId;

  const notification = await prisma.notification.findFirst({ where });
  if (!notification) throw new Error('Notification not found');

  await prisma.notification.delete({ where: { id: notification.id } });
  return true;
};

const getUnreadCount = async (storeId, userId) => {
  const where = { is_read: false };
  if (storeId) where.store_id = storeId;
  if (userId) where.user_id = userId;

  return await prisma.notification.count({ where });
};

const clearNotifications = async (storeId, userId) => {
  const where = {};
  if (storeId) where.store_id = storeId;
  if (userId) where.user_id = userId;

  await prisma.notification.deleteMany({ where });
  return true;
};

const checkLowStock = async (storeId, products) => {
  const lowStockItems = products.filter(p =>
    p.track_stock && parseFloat(p.stock_quantity) <= parseFloat(p.low_stock_threshold)
  );

  for (const product of lowStockItems) {
    await createNotification({
      store_id: storeId,
      type: 'low_stock',
      title: 'Low Stock Alert',
      message: `${product.name} is running low. Current stock: ${product.stock_quantity} ${product.unit}`,
      data: { product_id: product.id, stock: product.stock_quantity, threshold: product.low_stock_threshold },
    });
  }

  return lowStockItems.length;
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  clearNotifications,
  checkLowStock,
};
