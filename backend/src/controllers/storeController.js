const prisma = require('../prisma');
const response = require('../utils/response');

const getStore = async (req, res, next) => {
  try {
    const store = await prisma.store.findUnique({
      where: { id: req.tenantId },
      include: {
        subscriptions: {
          include: { plan: true },
          take: 1,
        },
      },
    });
    if (!store) return response.notFound(res, 'Store not found');
    response.success(res, store);
  } catch (error) {
    next(error);
  }
};

const updateStore = async (req, res, next) => {
  try {
    const allowedFields = [
      'name', 'email', 'phone', 'address', 'city', 'state', 'postal_code', 'country',
      'currency', 'timezone', 'tax_rate', 'tax_id', 'receipt_footer', 'receipt_header',
      'default_language', 'date_format', 'logo', 'settings',
    ];
    const data = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    });

    if (Object.keys(data).length === 0) {
      return response.error(res, 'No valid fields to update', 400);
    }

    const store = await prisma.store.update({
      where: { id: req.tenantId },
      data,
    });
    response.success(res, store, 'Store updated successfully');
  } catch (error) {
    next(error);
  }
};

const getStoreSettings = async (req, res, next) => {
  try {
    const store = await prisma.store.findUnique({
      where: { id: req.tenantId },
      select: {
        id: true, name: true, slug: true, email: true, phone: true, address: true,
        city: true, state: true, postal_code: true, country: true, logo: true,
        currency: true, timezone: true, tax_rate: true, tax_id: true,
        receipt_footer: true, receipt_header: true, default_language: true,
        date_format: true, settings: true, max_products: true, max_staff: true,
      },
    });
    if (!store) return response.notFound(res, 'Store not found');
    response.success(res, store);
  } catch (error) {
    next(error);
  }
};

const updateStoreSettings = async (req, res, next) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return response.error(res, 'Settings must be a valid object', 400);
    }
    const store = await prisma.store.findUnique({ where: { id: req.tenantId } });
    const currentSettings = store.settings || {};
    const newSettings = { ...currentSettings, ...settings };
    await prisma.store.update({
      where: { id: req.tenantId },
      data: { settings: newSettings },
    });
    response.success(res, { settings: newSettings }, 'Settings updated successfully');
  } catch (error) {
    next(error);
  }
};

const checkLimits = async (req, res, next) => {
  try {
    const store = await prisma.store.findUnique({ where: { id: req.tenantId } });
    const productCount = await prisma.product.count({
      where: { store_id: req.tenantId, is_active: true },
    });
    const staffCount = await prisma.user.count({
      where: { store_id: req.tenantId, status: 'active', role: { in: ['store_owner', 'manager', 'employee'] } },
    });

    response.success(res, {
      products: { current: productCount, limit: store.max_products, isExceeded: productCount >= store.max_products },
      staff: { current: staffCount, limit: store.max_staff, isExceeded: staffCount >= store.max_staff },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStore, updateStore, getStoreSettings, updateStoreSettings, checkLimits,
};
