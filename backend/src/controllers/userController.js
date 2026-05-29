const bcrypt = require('bcryptjs');
const prisma = require('../prisma');
const response = require('../utils/response');
const { paginate, getPaginationMeta } = require('../utils/helpers');
const tenantService = require('../services/tenantService');

const listUsers = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const { role, status, search } = req.query;
    const where = { store_id: req.tenantId };

    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [count, rows] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, phone: true, role: true, status: true, avatar: true, created_at: true, updated_at: true },
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

const getUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: BigInt(req.params.id), store_id: req.tenantId },
      select: { id: true, name: true, email: true, phone: true, role: true, status: true, avatar: true, permissions: true, created_at: true, updated_at: true },
    });
    if (!user) return response.notFound(res, 'User not found');
    response.success(res, user);
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const staffLimit = await tenantService.checkStaffLimit(req.tenantId);
    if (staffLimit.isExceeded) {
      return response.error(res, 'Staff limit reached. Upgrade your plan to add more users.', 403);
    }

    const { name, email, password, phone, role, permissions } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return response.error(res, 'User name is required', 400);
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return response.error(res, 'A valid email is required', 400);
    }
    if (!password || password.length < 6) {
      return response.error(res, 'Password is required and must be at least 6 characters', 400);
    }

    const existing = await prisma.user.findFirst({ where: { store_id: req.tenantId, email } });
    if (existing) return response.error(res, 'Email already exists in this store', 409);

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        store_id: req.tenantId,
        name,
        email,
        password: hashedPassword,
        phone,
        role: role || 'employee',
        permissions: permissions || {},
        status: 'active',
      },
      select: { id: true, name: true, email: true, phone: true, role: true, status: true, avatar: true, created_at: true },
    });

    response.created(res, user, 'User created successfully');
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: BigInt(req.params.id), store_id: req.tenantId },
    });
    if (!user) return response.notFound(res, 'User not found');

    const allowedFields = ['name', 'phone', 'role', 'permissions', 'status'];
    const data = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    });

    if (req.body.password) {
      data.password = await bcrypt.hash(req.body.password, 12);
    }

    if (Object.keys(data).length === 0) {
      return response.error(res, 'No valid fields to update', 400);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      select: { id: true, name: true, email: true, phone: true, role: true, status: true, avatar: true, permissions: true, created_at: true, updated_at: true },
    });

    response.success(res, updated, 'User updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: BigInt(req.params.id), store_id: req.tenantId },
    });
    if (!user) return response.notFound(res, 'User not found');
    if (user.role === 'store_owner') {
      return response.error(res, 'Cannot delete store owner', 403);
    }
    await prisma.user.delete({ where: { id: user.id } });
    response.success(res, null, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
};
