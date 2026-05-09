const prisma = require('../prisma');
const response = require('../utils/response');
const { paginate, getPaginationMeta } = require('../utils/helpers');

const listPayments = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const { payment_method, sale_id, purchase_id, start_date, end_date } = req.query;
    const where = { store_id: req.tenantId };
    if (payment_method) where.payment_method = payment_method;
    if (sale_id) where.sale_id = BigInt(sale_id);
    if (purchase_id) where.purchase_id = BigInt(purchase_id);
    if (start_date) where.payment_date = { gte: new Date(start_date) };
    if (end_date) where.payment_date = { lte: new Date(end_date) };

    const [count, rows] = await prisma.$transaction([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        include: { sale: { select: { id: true, invoice_number: true, total_amount: true } } },
        skip: offset,
        take: limit,
        orderBy: [{ payment_date: 'desc' }, { created_at: 'desc' }],
      }),
    ]);

    const totals = await prisma.payment.aggregate({
      where,
      _sum: { amount: true },
      _count: { id: true },
    });

    response.paginated(res, {
      payments: rows,
      summary: { total_amount: totals._sum.amount || 0, total_count: totals._count.id || 0 },
    }, getPaginationMeta(count, page, limit));
  } catch (error) {
    next(error);
  }
};

const getPayment = async (req, res, next) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: { id: BigInt(req.params.id), store_id: req.tenantId },
      include: { sale: true },
    });
    if (!payment) return response.notFound(res, 'Payment not found');
    response.success(res, payment);
  } catch (error) {
    next(error);
  }
};

const createPayment = async (req, res, next) => {
  try {
    const { sale_id, purchase_id, amount, payment_method, payment_date, reference_number, notes } = req.body;

    if (!sale_id && !purchase_id) {
      return response.error(res, 'Either sale_id or purchase_id is required', 400);
    }

    if (!amount || amount <= 0) {
      return response.error(res, 'Valid amount is required', 400);
    }

    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          store_id: req.tenantId,
          sale_id: sale_id ? BigInt(sale_id) : null,
          purchase_id: purchase_id ? BigInt(purchase_id) : null,
          amount: parseFloat(amount),
          payment_method: payment_method || 'cash',
          payment_date: payment_date ? new Date(payment_date) : new Date(),
          reference_number: reference_number || null,
          notes: notes || null,
        },
      });

      if (sale_id) {
        const sale = await tx.sale.findUnique({ where: { id: BigInt(sale_id) } });
        if (sale) {
          const newPaid = parseFloat(sale.paid_amount) + parseFloat(amount);
          const newDue = parseFloat(sale.total_amount) - newPaid;
          await tx.sale.update({
            where: { id: sale.id },
            data: {
              paid_amount: newPaid,
              due_amount: Math.max(0, newDue),
              payment_status: newDue <= 0 ? 'paid' : 'partial',
            },
          });
        }
      }

      if (purchase_id) {
        const purchase = await tx.purchase.findUnique({ where: { id: BigInt(purchase_id) } });
        if (purchase) {
          const newPaid = parseFloat(purchase.paid_amount) + parseFloat(amount);
          const newDue = parseFloat(purchase.total_amount) - newPaid;
          await tx.purchase.update({
            where: { id: purchase.id },
            data: {
              paid_amount: newPaid,
              due_amount: Math.max(0, newDue),
              payment_status: newDue <= 0 ? 'paid' : 'partial',
            },
          });
        }
      }

      return p;
    });

    const created = await prisma.payment.findUnique({
      where: { id: payment.id },
      include: { sale: true },
    });

    response.created(res, created, 'Payment recorded successfully');
  } catch (error) {
    next(error);
  }
};

const updatePayment = async (req, res, next) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: { id: BigInt(req.params.id), store_id: req.tenantId },
    });
    if (!payment) return response.notFound(res, 'Payment not found');

    const allowedFields = ['notes', 'reference_number'];
    const data = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    });

    if (Object.keys(data).length === 0) {
      return response.error(res, 'No valid fields to update', 400);
    }

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data,
    });
    response.success(res, updated, 'Payment updated successfully');
  } catch (error) {
    next(error);
  }
};

const deletePayment = async (req, res, next) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: { id: BigInt(req.params.id), store_id: req.tenantId },
    });
    if (!payment) return response.notFound(res, 'Payment not found');

    await prisma.$transaction(async (tx) => {
      if (payment.sale_id) {
        const sale = await tx.sale.findUnique({ where: { id: payment.sale_id } });
        if (sale) {
          const newPaid = parseFloat(sale.paid_amount) - parseFloat(payment.amount);
          const totalAmount = parseFloat(sale.total_amount);
          await tx.sale.update({
            where: { id: sale.id },
            data: {
              paid_amount: Math.max(0, newPaid),
              due_amount: totalAmount - Math.max(0, newPaid),
              payment_status: newPaid <= 0 ? 'unpaid' : 'partial',
            },
          });
        }
      }

      await tx.payment.delete({ where: { id: payment.id } });
    });

    response.success(res, null, 'Payment deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
};
