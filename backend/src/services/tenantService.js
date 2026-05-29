const prisma = require('../prisma');
const { generateSlug } = require('../utils/helpers');
const bcrypt = require('bcryptjs');

const createTenant = async ({ name, owner_name, email, password, phone, address, city, state, country }) => {
  const result = await prisma.$transaction(async (tx) => {
    const slug = generateSlug(name);
    const store = await tx.store.create({
      data: {
        name,
        slug,
        email,
        phone,
        address,
        city,
        state,
        country: country || 'US',
        status: 'trial',
        trial_ends_at: new Date(Date.now() + parseInt(process.env.DEFAULT_TRIAL_DAYS || 14) * 24 * 60 * 60 * 1000),
        max_products: parseInt(process.env.PLAN_FREE_MAX_PRODUCTS || 100),
        max_staff: parseInt(process.env.PLAN_FREE_MAX_STAFF || 2),
      },
    });

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await tx.user.create({
      data: {
        store_id: store.id,
        name: owner_name || 'Owner',
        email,
        password: hashedPassword,
        role: 'store_owner',
        status: 'active',
      },
    });

    let freePlan = await tx.subscriptionPlan.findFirst({ where: { slug: 'free' } });
    if (!freePlan) {
      freePlan = await tx.subscriptionPlan.create({
        data: {
          name: 'Free', slug: 'free', description: 'Free plan for trial users',
          price_monthly: 0, price_yearly: 0,
          max_products: 100, max_staff: 2,
          is_active: true, sort_order: 0,
        },
      });
    }
    await tx.subscription.create({
      data: {
        store_id: store.id,
        plan_id: freePlan.id,
        status: 'trial',
        start_date: new Date(),
        trial_ends_at: store.trial_ends_at,
      },
    });

    return { store, user };
  });

  return result;
};

const getTenantInfo = async (storeId) => {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: {
      subscriptions: { include: { plan: true } },
    },
  });
  return store;
};

const checkProductLimit = async (storeId) => {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) throw new Error('Store not found');
  const count = await prisma.product.count({ where: { store_id: storeId, is_active: true } });
  return {
    current: count,
    limit: store.max_products,
    isExceeded: count >= store.max_products,
  };
};

const checkStaffLimit = async (storeId) => {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) throw new Error('Store not found');
  const count = await prisma.user.count({
    where: { store_id: storeId, status: 'active', role: { in: ['store_owner', 'manager', 'employee'] } },
  });
  return {
    current: count,
    limit: store.max_staff,
    isExceeded: count >= store.max_staff,
  };
};

const updateTenant = async (storeId, data) => {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) throw new Error('Store not found');
  await prisma.store.update({ where: { id: storeId }, data });
  return store;
};

const suspendTenant = async (storeId) => {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) throw new Error('Store not found');
  await prisma.store.update({
    where: { id: storeId },
    data: { status: 'suspended', is_active: false },
  });
  await prisma.user.updateMany({
    where: { store_id: storeId },
    data: { status: 'inactive' },
  });
  return store;
};

const activateTenant = async (storeId) => {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) throw new Error('Store not found');
  await prisma.store.update({
    where: { id: storeId },
    data: { status: 'active', is_active: true },
  });
  await prisma.user.updateMany({
    where: { store_id: storeId, status: 'inactive' },
    data: { status: 'active' },
  });
  return store;
};

const deleteTenant = async (storeId) => {
  await prisma.$transaction(async (tx) => {
    await tx.notification.deleteMany({ where: { store_id: storeId } });
    await tx.activityLog.deleteMany({ where: { store_id: storeId } });
    await tx.payment.deleteMany({ where: { store_id: storeId } });

    const sales = await tx.sale.findMany({ where: { store_id: storeId }, select: { id: true } });
    const saleIds = sales.map(s => s.id);
    if (saleIds.length > 0) {
      await tx.saleItem.deleteMany({ where: { sale_id: { in: saleIds } } });
    }
    await tx.sale.deleteMany({ where: { store_id: storeId } });

    const purchases = await tx.purchase.findMany({ where: { store_id: storeId }, select: { id: true } });
    const purchaseIds = purchases.map(p => p.id);
    if (purchaseIds.length > 0) {
      await tx.purchaseItem.deleteMany({ where: { purchase_id: { in: purchaseIds } } });
    }
    await tx.purchase.deleteMany({ where: { store_id: storeId } });

    await tx.expense.deleteMany({ where: { store_id: storeId } });
    await tx.product.deleteMany({ where: { store_id: storeId } });
    await tx.category.deleteMany({ where: { store_id: storeId } });
    await tx.customer.deleteMany({ where: { store_id: storeId } });
    await tx.supplier.deleteMany({ where: { store_id: storeId } });
    await tx.user.deleteMany({ where: { store_id: storeId } });
    await tx.subscription.deleteMany({ where: { store_id: storeId } });
    await tx.backup.deleteMany({ where: { store_id: storeId } });
    await tx.store.delete({ where: { id: storeId } });
  });

  return true;
};

module.exports = {
  createTenant,
  getTenantInfo,
  checkProductLimit,
  checkStaffLimit,
  updateTenant,
  suspendTenant,
  activateTenant,
  deleteTenant,
};
