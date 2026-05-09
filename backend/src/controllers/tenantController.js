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
          subscription: true,
          users: { where: { role: 'store_owner' }, select: { id: true, name: true, email: true } },
        },
        skip: offset,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
    ]);

    const enrichedRows = await Promise.all(rows.map(async (store) => {
      const userCount = await prisma.user.count({ where: { store_id: store.id } });
      return { ...store, user_count: userCount };
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
        subscription: true,
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
    if (!name || !email) {
      return response.error(res, 'Store name and email are required', 400);
    }

    const existing = await prisma.store.findFirst({ where: { email } });
    if (existing) return response.error(res, 'Store with this email already exists', 409);

    const slug = name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-') + '-' + Date.now().toString(36);

    let planRecord = null;
    if (plan && plan !== 'free') {
      planRecord = await prisma.subscriptionPlan.findFirst({ where: { slug: plan } });
    }
    if (!planRecord) {
      planRecord = await prisma.subscriptionPlan.findFirst({ where: { slug: 'free' } });
    }

    const store = await prisma.store.create({
      data: {
        name, slug, email, phone: phone || null, address: address || null,
        status: status || 'trial',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        max_products: planRecord?.max_products || 100,
        max_staff: planRecord?.max_staff || 2,
      },
    });

    const tempPassword = 'changeme123';
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

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
      include: { subscription: true },
    });

    response.created(res, created, 'Tenant created successfully');
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
    const [totalStores, activeStores, trialStores, suspendedStores, totalUsers, stores, subscriptions, plans, recentStores] = await Promise.all([
      prisma.store.count(),
      prisma.store.count({ where: { status: 'active' } }),
      prisma.store.count({ where: { status: 'trial' } }),
      prisma.store.count({ where: { status: 'suspended' } }),
      prisma.user.count(),
      prisma.store.findMany({ select: { created_at: true } }),
      prisma.subscription.findMany({ include: { plan: true } }),
      prisma.subscriptionPlan.findMany(),
      prisma.store.findMany({ orderBy: { created_at: 'desc' }, take: 10 }),
    ]);

    const monthlyCounts = {};
    stores.forEach(s => {
      const d = new Date(s.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyCounts[key] = (monthlyCounts[key] || 0) + 1;
    });
    const sortedMonths = Object.keys(monthlyCounts).sort();
    const storeGrowth = {
      labels: sortedMonths,
      data: sortedMonths.map(m => monthlyCounts[m]),
    };

    let cumulative = 0;
    const cumulativeData = sortedMonths.map(m => { cumulative += monthlyCounts[m]; return cumulative; });
    const storeGrowthCumulative = {
      labels: sortedMonths,
      data: cumulativeData,
    };

    const revenueByMonth = {};
    subscriptions.forEach(sub => {
      if (sub.plan?.price_monthly && sub.status === 'active') {
        const d = new Date(sub.start_date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        revenueByMonth[key] = (revenueByMonth[key] || 0) + Number(sub.plan.price_monthly);
      }
    });
    const revenueData = {
      labels: Object.keys(revenueByMonth).sort(),
      data: sortedMonths.map(m => revenueByMonth[m] || 0),
    };

    const planDist = {};
    subscriptions.forEach(sub => {
      const name = sub.plan?.name || 'Free';
      planDist[name] = (planDist[name] || 0) + 1;
    });
    stores.filter(s => !subscriptions.find(sub => sub.store_id === s.id)).forEach(() => {
      planDist['Free'] = (planDist['Free'] || 0) + 1;
    });

    const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
    const mrr = subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + Number(s.plan?.price_monthly || 0), 0);

    const recentRegistrations = await Promise.all(recentStores.map(async (store) => {
      const sub = await prisma.subscription.findFirst({
        where: { store_id: store.id },
        include: { plan: true },
      });
      return {
        name: store.name,
        plan: sub?.plan?.slug || 'free',
        createdAt: store.created_at,
      };
    }));

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const prevCount = await prisma.store.count({
      where: { created_at: { gte: lastMonth } },
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
      subscriptionRate: activeSubscriptions > 0 ? Math.round((activeSubscriptions / totalStores) * 100) : 0,
      mrrGrowth: 0,
      trialConversion: trialStores > 0 ? Math.round((activeStores / (trialStores + activeStores)) * 100) : 0,
    });
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
};
