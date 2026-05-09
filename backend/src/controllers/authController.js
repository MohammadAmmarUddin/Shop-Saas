const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const { generateSlug } = require('../utils/helpers');
const response = require('../utils/response');

const generateTokens = (user) => {
  const payload = { id: Number(user.id), store_id: user.store_id ? Number(user.store_id) : null, role: user.role };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
  return { accessToken, refreshToken };
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, store_name, store_phone, store_address, store_city, store_state, store_country } = req.body;

    const existingUser = await prisma.user.findFirst({ where: { email } });
    if (existingUser) {
      return response.error(res, 'Email already registered', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const slug = generateSlug(store_name || name);

    const store = await prisma.store.create({
      data: {
        name: store_name || `${name}'s Store`,
        slug,
        email,
        phone: store_phone || phone,
        address: store_address,
        city: store_city,
        state: store_state,
        country: store_country || 'US',
        status: 'trial',
        trial_ends_at: new Date(Date.now() + parseInt(process.env.DEFAULT_TRIAL_DAYS || 14) * 24 * 60 * 60 * 1000),
        max_products: parseInt(process.env.PLAN_FREE_MAX_PRODUCTS || 100),
        max_staff: parseInt(process.env.PLAN_FREE_MAX_STAFF || 2),
      },
    });

    const user = await prisma.user.create({
      data: {
        store_id: store.id,
        name: name || 'Owner',
        email,
        password: hashedPassword,
        role: 'store_owner',
        status: 'active',
      },
    });

    let freePlan = await prisma.subscriptionPlan.findFirst({ where: { slug: 'free' } });
    if (!freePlan) {
      freePlan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Free',
          slug: 'free',
          description: 'Free plan',
          price_monthly: 0,
          price_yearly: 0,
          max_products: 100,
          max_staff: 2,
          is_active: true,
          sort_order: 0,
        },
      });
    }
    await prisma.subscription.create({
      data: {
        store_id: store.id,
        plan_id: freePlan.id,
        status: 'trial',
        start_date: new Date(),
        trial_ends_at: store.trial_ends_at,
      },
    });

    const tokens = generateTokens(user);
    await prisma.user.update({
      where: { id: user.id },
      data: { refresh_token: tokens.refreshToken, last_login_at: new Date() },
    });

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, phone: true, role: true, status: true, store_id: true, created_at: true },
    });

    response.created(res, { user: userData, tokens }, 'Registration successful');
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findFirst({
      where: { email },
      include: { store: true },
    });

    if (!user) {
      return response.unauthorized(res, 'Invalid email or password');
    }

    if (user.status !== 'active') {
      return response.forbidden(res, 'Account is deactivated. Contact your administrator.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return response.unauthorized(res, 'Invalid email or password');
    }

    const tokens = generateTokens(user);
    await prisma.user.update({
      where: { id: user.id },
      data: { refresh_token: tokens.refreshToken, last_login_at: new Date() },
    });

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, phone: true, role: true, status: true, store_id: true, avatar: true, permissions: true, created_at: true },
    });

    response.success(res, { user: userData, tokens }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return response.error(res, 'Refresh token is required', 400);
    }

    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: BigInt(decoded.id) },
      select: { id: true, refresh_token: true, status: true, store_id: true, role: true },
    });

    if (!user || user.refresh_token !== refresh_token) {
      return response.unauthorized(res, 'Invalid refresh token');
    }

    if (user.status !== 'active') {
      return response.forbidden(res, 'Account is deactivated');
    }

    const tokens = generateTokens(user);
    await prisma.user.update({
      where: { id: user.id },
      data: { refresh_token: tokens.refreshToken },
    });

    response.success(res, { tokens }, 'Token refreshed successfully');
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return response.unauthorized(res, 'Invalid or expired refresh token');
    }
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { refresh_token: null },
    });
    response.success(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, email: true, phone: true, role: true, status: true,
        store_id: true, avatar: true, permissions: true, last_login_at: true,
        created_at: true, updated_at: true,
      },
    });

    if (!user) {
      return response.notFound(res, 'User not found');
    }

    response.success(res, user);
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) {
      return response.error(res, 'Current password is incorrect', 400);
    }

    const hashedPassword = await bcrypt.hash(new_password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    response.success(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, phone },
      select: { id: true, name: true, email: true, phone: true, role: true, status: true, store_id: true },
    });
    response.success(res, user, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register, login, refresh, logout, getMe, changePassword, updateProfile,
};
