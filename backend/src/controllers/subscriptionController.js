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

module.exports = {
  getSubscription,
  getPlans,
  subscribe,
  cancelSubscription,
  getSubscriptionStatus,
};
