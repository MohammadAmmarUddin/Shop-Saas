const prisma = require('../prisma');
const response = require('../utils/response');
const { paginate, getPaginationMeta } = require('../utils/helpers');

const listCustomers = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const { search, is_active } = req.query;
    const where = { store_id: req.tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }
    if (is_active !== undefined) {
      where.is_active = is_active === 'true' || is_active === '1';
    }

    const [count, rows] = await prisma.$transaction([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { name: 'asc' },
      }),
    ]);

    response.paginated(res, rows, getPaginationMeta(count, page, limit));
  } catch (error) {
    next(error);
  }
};

const getCustomer = async (req, res, next) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: BigInt(req.params.id), store_id: req.tenantId },
    });
    if (!customer) return response.notFound(res, 'Customer not found');

    const recentSales = await prisma.sale.findMany({
      where: { customer_id: customer.id, store_id: req.tenantId },
      orderBy: { created_at: 'desc' },
      take: 10,
    });

    const salesStats = await prisma.sale.aggregate({
      where: { customer_id: customer.id, store_id: req.tenantId },
      _count: { id: true },
      _sum: { total_amount: true, paid_amount: true, due_amount: true },
    });

    response.success(res, {
      ...customer,
      recent_sales: recentSales,
      stats: {
        total_orders: salesStats._count.id || 0,
        total_spent: salesStats._sum.total_amount || 0,
        total_paid: salesStats._sum.paid_amount || 0,
        total_due: salesStats._sum.due_amount || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

const createCustomer = async (req, res, next) => {
  try {
    const {
      name, email, phone, address, city, state, postal_code,
      notes,
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return response.error(res, 'Customer name is required', 400);
    }

    const customer = await prisma.customer.create({
      data: {
        store_id: req.tenantId,
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        postal_code: postal_code || null,
        notes: notes || null,
      },
    });

    response.created(res, customer, 'Customer created successfully');
  } catch (error) {
    next(error);
  }
};

const updateCustomer = async (req, res, next) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: BigInt(req.params.id), store_id: req.tenantId },
    });
    if (!customer) return response.notFound(res, 'Customer not found');

    const allowedFields = [
      'name', 'email', 'phone', 'address', 'city', 'state',
      'postal_code', 'notes', 'is_active',
    ];

    const data = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    });

    if (Object.keys(data).length === 0) {
      return response.error(res, 'No valid fields to update', 400);
    }

    const updated = await prisma.customer.update({
      where: { id: customer.id },
      data,
    });
    response.success(res, updated, 'Customer updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: BigInt(req.params.id), store_id: req.tenantId },
    });
    if (!customer) return response.notFound(res, 'Customer not found');

    const saleCount = await prisma.sale.count({ where: { customer_id: customer.id } });
    if (saleCount > 0) {
      return response.error(res, `Cannot delete customer. ${saleCount} sale(s) are associated with them.`, 400);
    }

    await prisma.customer.delete({ where: { id: customer.id } });
    response.success(res, null, 'Customer deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
