const prisma = require('../prisma');
const response = require('../utils/response');
const { paginate, getPaginationMeta } = require('../utils/helpers');

const listSuppliers = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const { search, is_active } = req.query;
    const where = { store_id: req.tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { company: { contains: search } },
      ];
    }
    if (is_active !== undefined) {
      where.is_active = is_active === 'true' || is_active === '1';
    }

    const [count, rows] = await prisma.$transaction([
      prisma.supplier.count({ where }),
      prisma.supplier.findMany({
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

const getSupplier = async (req, res, next) => {
  try {
    const supplier = await prisma.supplier.findFirst({
      where: { id: BigInt(req.params.id), store_id: req.tenantId },
    });
    if (!supplier) return response.notFound(res, 'Supplier not found');

    const recentPurchases = await prisma.purchase.findMany({
      where: { supplier_id: supplier.id, store_id: req.tenantId },
      orderBy: { created_at: 'desc' },
      take: 10,
    });

    response.success(res, {
      ...supplier,
      recent_purchases: recentPurchases,
    });
  } catch (error) {
    next(error);
  }
};

const createSupplier = async (req, res, next) => {
  try {
    const {
      name, email, phone, address, city, state, postal_code,
      country, company, notes,
    } = req.body;

    const supplier = await prisma.supplier.create({
      data: {
        store_id: req.tenantId,
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        postal_code: postal_code || null,
        country: country || 'US',
        company: company || null,
        notes: notes || null,
      },
    });

    response.created(res, supplier, 'Supplier created successfully');
  } catch (error) {
    next(error);
  }
};

const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await prisma.supplier.findFirst({
      where: { id: BigInt(req.params.id), store_id: req.tenantId },
    });
    if (!supplier) return response.notFound(res, 'Supplier not found');

    const allowedFields = [
      'name', 'email', 'phone', 'address', 'city', 'state',
      'postal_code', 'country', 'company', 'notes', 'is_active',
    ];

    const data = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    });

    if (Object.keys(data).length === 0) {
      return response.error(res, 'No valid fields to update', 400);
    }

    const updated = await prisma.supplier.update({
      where: { id: supplier.id },
      data,
    });
    response.success(res, updated, 'Supplier updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await prisma.supplier.findFirst({
      where: { id: BigInt(req.params.id), store_id: req.tenantId },
    });
    if (!supplier) return response.notFound(res, 'Supplier not found');

    const purchaseCount = await prisma.purchase.count({ where: { supplier_id: supplier.id } });
    if (purchaseCount > 0) {
      return response.error(res, `Cannot delete supplier. ${purchaseCount} purchase(s) are associated.`, 400);
    }

    await prisma.supplier.delete({ where: { id: supplier.id } });
    response.success(res, null, 'Supplier deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
