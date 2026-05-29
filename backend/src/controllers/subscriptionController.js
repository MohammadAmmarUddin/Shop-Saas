const subscriptionService = require('../services/subscriptionService');
const response = require('../utils/response');

const getSubscription = async (req, res, next) => {
  try {
    const sub = await subscriptionService.getCurrentSubscription(req.tenantId);
    if (!sub) return response.notFound(res, 'No subscription found');
    response.success(res, sub);
  } catch (error) {
    next(error);
  }
};

const getPlans = async (req, res, next) => {
  try {
    const plans = await subscriptionService.getAvailablePlans();
    response.success(res, plans);
  } catch (error) {
    next(error);
  }
};

const subscribe = async (req, res, next) => {
  try {
    const { plan_id, billing_period } = req.body;
    if (!plan_id) return response.error(res, 'Plan ID is required', 400);

    const subscription = await subscriptionService.subscribeToPlan(req.tenantId, plan_id, billing_period || 'monthly');
    response.success(res, subscription, 'Subscribed successfully');
  } catch (error) {
    next(error);
  }
};

const cancelSubscription = async (req, res, next) => {
  try {
    const sub = await subscriptionService.cancelSubscription(req.tenantId);
    response.success(res, sub, 'Subscription cancelled');
  } catch (error) {
    next(error);
  }
};

const getSubscriptionStatus = async (req, res, next) => {
  try {
    const status = await subscriptionService.checkSubscriptionStatus(req.tenantId);
    response.success(res, status);
  } catch (error) {
    next(error);
  }
};

const getPaymentMethods = async (req, res, next) => {
  try {
    const methods = await subscriptionService.getPaymentMethods();
    response.success(res, methods);
  } catch (error) {
    next(error);
  }
};

const submitManualPayment = async (req, res, next) => {
  try {
    const { plan_id, payment_method, transaction_id, sender_identifier, notes, billing_period } = req.body;

    if (!plan_id) return response.error(res, 'Plan ID is required', 400);
    if (!payment_method) return response.error(res, 'Payment method is required', 400);
    if (!transaction_id) return response.error(res, 'Transaction ID / reference number is required', 400);

    const payment = await subscriptionService.submitManualPayment(req.tenantId, {
      plan_id, payment_method, transaction_id, sender_identifier, notes, billing_period,
    });

    response.created(res, payment, 'Payment submitted successfully. Awaiting admin approval.');
  } catch (error) {
    if (error.message === 'No subscription found') {
      return response.notFound(res, 'No subscription found for your store');
    }
    if (error.message === 'Plan not found') {
      return response.notFound(res, 'Subscription plan not found');
    }
    if (error.message?.includes('Invalid payment method')) {
      return response.error(res, error.message, 400);
    }
    next(error);
  }
};

const getPaymentHistory = async (req, res, next) => {
  try {
    const payments = await subscriptionService.getPaymentHistory(req.tenantId);
    response.success(res, payments);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSubscription,
  getPlans,
  subscribe,
  cancelSubscription,
  getSubscriptionStatus,
  getPaymentMethods,
  submitManualPayment,
  getPaymentHistory,
};
