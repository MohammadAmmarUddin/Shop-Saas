const prisma = require('../prisma');
const tenantService = require('../services/tenantService');
const response = require('../utils/response');
const { paginate, getPaginationMeta } = require('../utils/helpers');

const listTenants = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const { search, status } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { slug: { contains: search } },
      ];
    }
    if (status) where.status = status;

    const [count, rows] = await prisma.$transaction([
      prisma.store.count({ where }),
      prisma.store.findMany({
        where,
        include: {
          subscriptions: { take: 1, include: { plan: true } },
          users: { where: { role: 'store_owner' }, select: { id: true, name: true, email: true } },
        },
        skip: offset,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
    ]);

    const enrichedRows = rows.map((store) => ({
      ...store,
      user_count: store.users?.length || 0,
    }));

    response.paginated(res, enrichedRows, getPaginationMeta(count, page, limit));
  } catch (error) {
    next(error);
  }
};

const getTenant = async (req, res, next) => {
  try {
    const store = await prisma.store.findUnique({
      where: { id: BigInt(req.params.id) },
      include: {
        subscriptions: { include: { plan: true } },
        users: { select: { id: true, name: true, email: true, phone: true, role: true, status: true, created_at: true } },
      },
    });
    if (!store) return response.notFound(res, 'Tenant not found');
    response.success(res, store);
  } catch (error) {
    next(error);
  }
};

const updateTenant = async (req, res, next) => {
  try {
    const store = await prisma.store.findUnique({ where: { id: BigInt(req.params.id) } });
    if (!store) return response.notFound(res, 'Tenant not found');

    const allowedFields = [
      'name', 'email', 'phone', 'address', 'city', 'state', 'postal_code', 'country',
      'status', 'max_products', 'max_staff', 'is_active', 'settings',
    ];
    const data = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    });

    if (Object.keys(data).length === 0) {
      return response.error(res, 'No valid fields to update', 400);
    }

    const updated = await prisma.store.update({
      where: { id: store.id },
      data,
    });
    response.success(res, updated, 'Tenant updated successfully');
  } catch (error) {
    next(error);
  }
};

const suspendTenant = async (req, res, next) => {
  try {
    const store = await tenantService.suspendTenant(BigInt(req.params.id));
    response.success(res, store, 'Tenant suspended');
  } catch (error) {
    next(error);
  }
};

const activateTenant = async (req, res, next) => {
  try {
    const store = await tenantService.activateTenant(BigInt(req.params.id));
    response.success(res, store, 'Tenant activated');
  } catch (error) {
    next(error);
  }
};

const deleteTenant = async (req, res, next) => {
  try {
    await tenantService.deleteTenant(BigInt(req.params.id));
    response.success(res, null, 'Tenant and all associated data deleted');
  } catch (error) {
    next(error);
  }
};

const createTenant = async (req, res, next) => {
  try {
    const { name, email, phone, address, plan, status } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return response.error(res, 'Store name is required', 400);
    }
    if (name.trim().length > 200) {
      return response.error(res, 'Store name must be at most 200 characters', 400);
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return response.error(res, 'A valid email is required', 400);
    }
    if (email.length > 100) {
      return response.error(res, 'Email must be at most 100 characters', 400);
    }
    if (status && !['active', 'inactive', 'suspended', 'trial'].includes(status)) {
      return response.error(res, 'Status must be one of: active, inactive, suspended, trial', 400);
    }
    if (status === 'suspended') {
      return response.error(res, 'Cannot create a tenant with suspended status', 400);
    }

    const existingEmail = await prisma.store.findFirst({ where: { email } });
    if (existingEmail) {
      return response.error(res, 'A store with this email is already registered', 409);
    }

    const rawSlug = name.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');
    const slug = rawSlug + '-' + Date.now().toString(36);
    const existingSlug = await prisma.store.findUnique({ where: { slug } });
    if (existingSlug) {
      return response.error(res, 'A store with this name already exists', 409);
    }

    let planRecord = null;
    if (plan && plan !== 'free') {
      planRecord = await prisma.subscriptionPlan.findFirst({ where: { slug: plan } });
      if (!planRecord) {
        return response.error(res, `Subscription plan "${plan}" not found`, 404);
      }
    }
    if (!planRecord) {
      planRecord = await prisma.subscriptionPlan.findFirst({ where: { slug: 'free' } });
      if (!planRecord) {
        return response.error(res, 'Default "Free" subscription plan not found. Run seed first.', 500);
      }
    }

    const store = await prisma.store.create({
      data: {
        name: name.trim(), slug, email,
        phone: phone || null, address: address || null,
        status: status || 'trial',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        max_products: planRecord.max_products || 100,
        max_staff: planRecord.max_staff || 2,
      },
    });

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('tenant', 12);

    await prisma.user.create({
      data: {
        store_id: store.id, name: 'Owner', email,
        password: hashedPassword, role: 'store_owner', status: 'active',
      },
    });

    await prisma.subscription.create({
      data: {
        store_id: store.id, plan_id: planRecord.id,
        status: status === 'active' ? 'active' : 'trial',
        start_date: new Date(),
        trial_ends_at: store.trial_ends_at,
      },
    });

    const created = await prisma.store.findUnique({
      where: { id: store.id },
      include: {
        subscriptions: { include: { plan: true } },
        users: { where: { role: 'store_owner' }, select: { id: true, name: true, email: true } },
      },
    });

    response.created(res, {
      ...created,
      default_password: 'tenant',
    }, 'Tenant created successfully. Default password is "tenant".');
  } catch (error) {
    next(error);
  }
};

const updateTenantStatus = async (req, res, next) => {
  try {
    const store = await prisma.store.findUnique({ where: { id: BigInt(req.params.id) } });
    if (!store) return response.notFound(res, 'Tenant not found');

    const { status } = req.body;
    if (!status) return response.error(res, 'Status is required', 400);

    const updated = await prisma.store.update({
      where: { id: store.id },
      data: { status },
    });
    response.success(res, updated, `Tenant status updated to ${status}`);
  } catch (error) {
    next(error);
  }
};

const changeTenantPlan = async (req, res, next) => {
  try {
    const store = await prisma.store.findUnique({ where: { id: BigInt(req.params.id) } });
    if (!store) return response.notFound(res, 'Tenant not found');

    const { planId } = req.body;
    if (!planId) return response.error(res, 'Plan ID is required', 400);

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: BigInt(planId) } });
    if (!plan) return response.notFound(res, 'Plan not found');

    const existingSub = await prisma.subscription.findFirst({ where: { store_id: store.id } });
    if (existingSub) {
      await prisma.subscription.update({
        where: { id: existingSub.id },
        data: { plan_id: plan.id },
      });
    } else {
      await prisma.subscription.create({
        data: { store_id: store.id, plan_id: plan.id, status: 'active', start_date: new Date() },
      });
    }

    await prisma.store.update({
      where: { id: store.id },
      data: { max_products: plan.max_products, max_staff: plan.max_staff },
    });

    response.success(res, null, 'Plan changed successfully');
  } catch (error) {
    next(error);
  }
};

const getTenantStats = async (req, res, next) => {
  try {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const [
      totalStores, activeStores, trialStores, suspendedStores,
      totalUsers, stores, subscriptions, recentStores, prevCount,
    ] = await Promise.all([
      prisma.store.count(),
      prisma.store.count({ where: { status: 'active' } }),
      prisma.store.count({ where: { status: 'trial' } }),
      prisma.store.count({ where: { status: 'suspended' } }),
      prisma.user.count(),
      prisma.store.findMany({ select: { id: true, created_at: true } }),
      prisma.subscription.findMany({ include: { plan: true } }),
      prisma.store.findMany({
        orderBy: { created_at: 'desc' },
        take: 10,
        include: {
          subscriptions: { take: 1, include: { plan: true } },
        },
      }),
      prisma.store.count({ where: { created_at: { gte: lastMonth } } }),
    ]);

    const monthlyCounts = {};
    stores.forEach(s => {
      const d = new Date(s.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyCounts[key] = (monthlyCounts[key] || 0) + 1;
    });
    const sortedMonths = Object.keys(monthlyCounts).sort();

    let cumulative = 0;
    const cumulativeData = sortedMonths.map(m => { cumulative += monthlyCounts[m]; return cumulative; });
    const storeGrowthCumulative = {
      labels: sortedMonths,
      data: cumulativeData,
    };

    const storeIds = new Set(stores.map(s => BigInt(s.id)));
    const subStoreIds = new Set(subscriptions.map(s => BigInt(s.store_id)));

    const revenueByMonth = {};
    subscriptions.forEach(sub => {
      if (sub.status === 'active' && sub.plan?.price_monthly) {
        const startDate = sub.start_date ? new Date(sub.start_date) : new Date();
        const key = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
        revenueByMonth[key] = (revenueByMonth[key] || 0) + Number(sub.plan.price_monthly);
      }
    });
    const revenueData = {
      labels: sortedMonths,
      data: sortedMonths.map(m => revenueByMonth[m] || 0),
    };

    const planDist = {};
    subscriptions.forEach(sub => {
      const name = sub.plan?.name || 'Free';
      planDist[name] = (planDist[name] || 0) + 1;
    });
    const storesWithoutSub = [...storeIds].filter(id => !subStoreIds.has(id)).length;
    planDist['Free'] = (planDist['Free'] || 0) + storesWithoutSub;

    const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
    const mrr = subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + Number(s.plan?.price_monthly || 0), 0);

    const recentRegistrations = recentStores.map(store => {
      const sub = store.subscriptions?.[0];
      return {
        name: store.name,
        plan: sub?.plan?.slug || 'free',
        createdAt: store.created_at,
      };
    });

    response.success(res, {
      totalStores,
      activeSubscriptions,
      mrr,
      trialUsers: trialStores,
      totalUsers,
      storeGrowth: storeGrowthCumulative,
      revenueData,
      planDistribution: planDist,
      recentRegistrations,
      storeGrowthRate: prevCount,
      subscriptionRate: totalStores > 0 ? Math.round((activeSubscriptions / totalStores) * 100) : 0,
      mrrGrowth: 0,
      trialConversion: totalStores > 0 ? Math.round((activeStores / totalStores) * 100) : 0,
    });
  } catch (error) {
    next(error);
  }
};

const listManualPayments = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const { status, store_id } = req.query;
    const where = {};
    if (status) where.status = status;
    if (store_id) where.store_id = BigInt(store_id);

    const [count, rows] = await prisma.$transaction([
      prisma.manualPayment.count({ where }),
      prisma.manualPayment.findMany({
        where,
        include: {
          store: { select: { id: true, name: true, email: true, slug: true } },
          subscription: { include: { plan: true } },
          approvedBy: { select: { id: true, name: true, email: true } },
        },
        skip: offset,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
    ]);

    response.paginated(res, rows, getPaginationMeta(count, page, limit));
  } catch (error) {
    next(error);
  }
};

const approveManualPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return response.error(res, 'Status must be "approved" or "rejected"', 400);
    }

    const payment = await prisma.manualPayment.findUnique({ where: { id: BigInt(id) } });
    if (!payment) return response.notFound(res, 'Payment record not found');
    if (payment.status !== 'pending') {
      return response.error(res, `Payment already ${payment.status}`, 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.manualPayment.update({
        where: { id: payment.id },
        data: {
          status,
          admin_notes: admin_notes?.trim() || null,
          approved_at: status === 'approved' ? new Date() : null,
          approved_by: status === 'approved' ? req.user.id : null,
        },
      });

      if (status === 'approved') {
        const subscription = await tx.subscription.findUnique({ where: { id: payment.subscription_id } });
        const plan = await tx.subscriptionPlan.findUnique({ where: { id: subscription.plan_id } });
        const now = new Date();
        const endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + 1);

        await tx.subscription.update({
          where: { id: payment.subscription_id },
          data: {
            status: 'active',
            start_date: now,
            current_period_ends_at: endDate,
            auto_renew: true,
          },
        });

        await tx.store.update({
          where: { id: payment.store_id },
          data: {
            status: 'active',
            max_products: plan.max_products,
            max_staff: plan.max_staff,
            subscription_ends_at: endDate,
          },
        });
      }
    });

    response.success(res, null, `Payment ${status} successfully`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listTenants,
  getTenant,
  createTenant,
  updateTenant,
  updateTenantStatus,
  changeTenantPlan,
  suspendTenant,
  activateTenant,
  deleteTenant,
  getTenantStats,
  listManualPayments,
  approveManualPayment,
};
