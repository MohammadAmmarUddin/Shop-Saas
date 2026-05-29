const prisma = require('../prisma');

const getCurrentSubscription = async (storeId) => {
  const subscription = await prisma.subscription.findFirst({
    where: { store_id: storeId },
    include: { plan: true },
  });
  return subscription;
};

const getAvailablePlans = async () => {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { is_active: true },
    orderBy: [{ sort_order: 'asc' }, { price_monthly: 'asc' }],
  });
  return plans;
};

const subscribeToPlan = async (storeId, planId, billingPeriod = 'monthly') => {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: BigInt(planId) } });
  if (!plan) throw new Error('Plan not found');

  const price = billingPeriod === 'yearly' ? plan.price_yearly : plan.price_monthly;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.subscription.findFirst({ where: { store_id: storeId } });
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + (billingPeriod === 'yearly' ? 12 : 1));

    if (existing) {
      await tx.subscription.update({
        where: { id: existing.id },
        data: {
          plan_id: plan.id,
          status: 'active',
          start_date: now,
          current_period_ends_at: endDate,
          billing_cycle: billingPeriod,
          auto_renew: true,
        },
      });
    } else {
      await tx.subscription.create({
        data: {
          store_id: storeId,
          plan_id: plan.id,
          status: 'active',
          billing_cycle: billingPeriod,
          start_date: now,
          current_period_ends_at: endDate,
          auto_renew: true,
        },
      });
    }

    await tx.store.update({
      where: { id: storeId },
      data: {
        max_products: plan.max_products,
        max_staff: plan.max_staff,
        status: 'active',
        subscription_ends_at: endDate,
      },
    });
  });

  return getCurrentSubscription(storeId);
};

const cancelSubscription = async (storeId) => {
  const subscription = await prisma.subscription.findFirst({ where: { store_id: storeId } });
  if (!subscription) throw new Error('No active subscription found');

  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'cancelled',
      auto_renew: false,
      cancelled_at: new Date(),
    },
  });

  return updated;
};

const processRenewals = async () => {
  const expired = await prisma.subscription.findMany({
    where: {
      status: 'active',
      current_period_ends_at: { lte: new Date() },
      auto_renew: true,
    },
    include: { plan: true },
  });

  for (const sub of expired) {
    try {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1);

      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          start_date: now,
          current_period_ends_at: endDate,
        },
      });

      await prisma.store.update({
        where: { id: sub.store_id },
        data: { subscription_ends_at: endDate },
      });
    } catch (error) {
      console.error(`Failed to renew subscription ${sub.id}:`, error);
    }
  }

  return expired.length;
};

const checkExpiredTrials = async () => {
  const expiredTrials = await prisma.subscription.findMany({
    where: {
      status: 'trial',
      trial_ends_at: { lte: new Date() },
    },
  });

  for (const sub of expiredTrials) {
    const freePlan = await prisma.subscriptionPlan.findFirst({ where: { slug: 'free' } });
    if (freePlan) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { plan_id: freePlan.id, status: 'active' },
      });
      await prisma.store.update({
        where: { id: sub.store_id },
        data: {
          max_products: freePlan.max_products,
          max_staff: freePlan.max_staff,
          status: 'active',
        },
      });
    } else {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'expired' },
      });
      await prisma.store.update({
        where: { id: sub.store_id },
        data: { status: 'inactive' },
      });
    }
  }

  return expiredTrials.length;
};

const getPaymentMethods = async () => {
  const gateways = await prisma.paymentGateway.findMany({
    where: { is_active: true },
    orderBy: { sort_order: 'asc' },
  });
  return gateways.map(g => ({
    id: g.slug,
    name: g.name,
    type: g.type,
    instructions: g.instructions,
    ...(g.config || {}),
  }));
};

const submitManualPayment = async (storeId, { plan_id, payment_method, transaction_id, sender_identifier, notes, billing_period }) => {
  const subscription = await prisma.subscription.findFirst({ where: { store_id: storeId } });
  if (!subscription) throw new Error('No subscription found');

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: BigInt(plan_id) } });
  if (!plan) throw new Error('Plan not found');

  const amount = billing_period === 'yearly' ? plan.price_yearly : plan.price_monthly;

  if (parseFloat(amount) <= 0) {
    throw new Error('This plan is free. No payment required.');
  }

  const validMethods = await getPaymentMethods();
  if (!validMethods.some(m => m.id === payment_method)) {
    const supported = validMethods.map(m => m.id).join(', ');
    throw new Error(`Invalid payment method. Supported: ${supported}`);
  }

  if (!transaction_id || !transaction_id.trim()) {
    throw new Error('Transaction ID / reference number is required');
  }

  const payment = await prisma.manualPayment.create({
    data: {
      store_id: storeId,
      subscription_id: subscription.id,
      amount,
      payment_method,
      transaction_id: transaction_id.trim(),
      sender_identifier: sender_identifier?.trim() || null,
      notes: notes?.trim() || null,
      status: 'pending',
    },
  });

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      payment_method,
      payment_details: {
        last_transaction: transaction_id.trim(),
        sender_identifier: sender_identifier?.trim() || null,
        submitted_at: new Date().toISOString(),
      },
    },
  });

  return payment;
};

const getPaymentHistory = async (storeId) => {
  const payments = await prisma.manualPayment.findMany({
    where: { store_id: storeId },
    orderBy: { created_at: 'desc' },
    include: {
      subscription: {
        include: { plan: true },
      },
      approvedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });
  return payments;
};

const checkSubscriptionStatus = async (storeId) => {
  const subscription = await getCurrentSubscription(storeId);
  if (!subscription) return { isActive: false, status: 'none' };

  const isActive = subscription.status === 'active' || subscription.status === 'trial';
  const now = new Date();

  if (subscription.status === 'trial' && subscription.trial_ends_at && new Date(subscription.trial_ends_at) < now) {
    return { isActive: true, status: 'trial_expired', subscription };
  }

  if (subscription.status === 'active' && subscription.current_period_ends_at && new Date(subscription.current_period_ends_at) < now) {
    return { isActive: false, status: 'expired', subscription };
  }

  return { isActive, status: subscription.status, subscription };
};

module.exports = {
  getCurrentSubscription,
  getAvailablePlans,
  subscribeToPlan,
  cancelSubscription,
  processRenewals,
  checkExpiredTrials,
  checkSubscriptionStatus,
  getPaymentMethods,
  submitManualPayment,
  getPaymentHistory,
};
