const prisma = require('../prisma');
const response = require('../utils/response');
const { paginate, getPaginationMeta, generateInvoiceNumber } = require('../utils/helpers');
const notificationService = require('../services/notificationService');

const listSales = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const { search, status, payment_status, customer_id, start_date, end_date } = req.query;
    const where = { store_id: req.tenantId };

    if (status) where.status = status;
    if (payment_status) where.payment_status = payment_status;
    if (customer_id) where.customer_id = BigInt(customer_id);
    if (start_date) where.created_at = { gte: new Date(start_date) };
    if (end_date) where.created_at = { ...where.created_at, lte: new Date(end_date + 'T23:59:59.999Z') };
    if (search) {
      where.invoice_number = { contains: search };
    }

    const [count, rows] = await prisma.$transaction([
      prisma.sale.count({ where }),
      prisma.sale.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          items: true,
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

const getSale = async (req, res, next) => {
  try {
    const sale = await prisma.sale.findFirst({
      where: { id: BigInt(req.params.id), store_id: req.tenantId },
      include: {
        customer: true,
        items: { include: { product: true } },
        payments: true,
        store: true,
      },
    });
    if (!sale) return response.notFound(res, 'Sale not found');
    response.success(res, sale);
  } catch (error) {
    next(error);
  }
};

const createSale = async (req, res, next) => {
  try {
    const {
      customer_id, items, discount_type, discount_value, discount_amount,
      shipping_amount, shipping_cost, payment_method, paid_amount,
      status, notes, prescription_id, is_pharmacy,
    } = req.body;

    if (!items || items.length === 0) {
      return response.error(res, 'At least one item is required', 400);
    }

    const productIds = items.map(i => BigInt(i.product_id));
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, store_id: req.tenantId },
    });

    const productMap = {};
    products.forEach(p => { productMap[p.id.toString()] = p; });

    const saleItems = [];
    let subtotal = 0;
    let totalTax = 0;

    for (const item of items) {
      const product = productMap[item.product_id];
      if (!product) {
        return response.error(res, `Product ID ${item.product_id} not found`, 404);
      }
      if (!product.is_active) {
        return response.error(res, `${product.name} is inactive`, 400);
      }
      if (product.track_stock && parseFloat(product.stock_quantity) < parseFloat(item.quantity)) {
        return response.error(res, `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}`, 400);
      }

      const itemTotal = parseFloat(item.quantity) * parseFloat(item.unit_price || product.selling_price);
      const itemTax = itemTotal * (parseFloat(item.tax_percentage || product.tax_percentage || 0) / 100);
      const itemDiscount = parseFloat(item.discount_amount || 0);

      subtotal += itemTotal;
      totalTax += itemTax;

      saleItems.push({
        product_id: product.id,
        quantity: item.quantity,
        unit_price: parseFloat(item.unit_price || product.selling_price),
        discount_amount: itemDiscount,
        tax_percentage: parseFloat(item.tax_percentage || product.tax_percentage || 0),
        tax_amount: itemTax,
        total: itemTotal + itemTax - itemDiscount,
      });
    }

    const invDiscount = parseFloat(discount_amount || 0);
    const invShipping = parseFloat(shipping_cost || shipping_amount || 0);
    const totalAmount = subtotal + totalTax - invDiscount + invShipping;
    const paid = parseFloat(paid_amount || 0);
    const dueAmount = totalAmount - paid;

    const invoiceNumber = generateInvoiceNumber(req.tenantId);

    const sale = await prisma.$transaction(async (tx) => {
      for (const si of saleItems) {
        if (productMap[si.product_id.toString()].track_stock) {
          const product = productMap[si.product_id.toString()];
          const newStock = parseFloat(product.stock_quantity) - parseFloat(si.quantity);
          await tx.product.update({
            where: { id: product.id },
            data: { stock_quantity: newStock },
          });
        }
      }

      const s = await tx.sale.create({
        data: {
          store_id: req.tenantId,
          invoice_number: invoiceNumber,
          customer_id: customer_id ? BigInt(customer_id) : null,
          user_id: req.user.id,
          subtotal: parseFloat(subtotal.toFixed(2)),
          tax_amount: parseFloat(totalTax.toFixed(2)),
          discount_amount: invDiscount,
          discount_type: discount_type || null,
          discount_value: parseFloat(discount_value || 0),
          shipping_cost: invShipping,
          total_amount: parseFloat(totalAmount.toFixed(2)),
          paid_amount: paid,
          due_amount: parseFloat(dueAmount.toFixed(2)),
          payment_status: dueAmount <= 0 ? 'paid' : (paid > 0 ? 'partial' : 'unpaid'),
          payment_method: payment_method || 'cash',
          status: status || 'completed',
          notes: notes || null,
          prescription_id: prescription_id || null,
          is_pharmacy: is_pharmacy || false,
          items: {
            create: saleItems.map(si => ({
              product_id: si.product_id,
              quantity: si.quantity,
              unit_price: si.unit_price,
              discount_amount: si.discount_amount,
              tax_percentage: si.tax_percentage,
              tax_amount: si.tax_amount,
              total: si.total,
            })),
          },
        },
        include: { items: true },
      });

      if (paid > 0) {
        await tx.payment.create({
          data: {
            store_id: req.tenantId,
            sale_id: s.id,
            amount: paid,
            payment_method: payment_method || 'cash',
            payment_date: new Date(),
          },
        });
      }

      if (customer_id) {
        await tx.customer.update({
          where: { id: BigInt(customer_id) },
          data: {
            total_purchases: { increment: totalAmount },
            total_paid: { increment: paid },
            balance: { increment: dueAmount },
          },
        });
      }

      return s;
    });

    const created = await prisma.sale.findUnique({
      where: { id: sale.id },
      include: { customer: true, items: true, payments: true },
    });

    await notificationService.checkLowStock(req.tenantId, products);

    response.created(res, created, 'Sale created successfully');
  } catch (error) {
    next(error);
  }
};

const updateSale = async (req, res, next) => {
  try {
    const sale = await prisma.sale.findFirst({
      where: { id: BigInt(req.params.id), store_id: req.tenantId },
    });
    if (!sale) return response.notFound(res, 'Sale not found');

    const allowedFields = ['payment_status', 'payment_method', 'paid_amount', 'status', 'notes'];
    const data = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    });

    if (data.paid_amount !== undefined) {
      data.due_amount = parseFloat(sale.total_amount) - parseFloat(data.paid_amount);
      if (data.due_amount <= 0) {
        data.payment_status = 'paid';
      } else if (parseFloat(data.paid_amount) > 0) {
        data.payment_status = 'partial';
      }
    }

    if (Object.keys(data).length === 0) {
      return response.error(res, 'No valid fields to update', 400);
    }

    await prisma.sale.update({
      where: { id: sale.id },
      data,
    });

    if (req.body.paid_amount && parseFloat(req.body.paid_amount) > parseFloat(sale.paid_amount)) {
      const extraPaid = parseFloat(req.body.paid_amount) - parseFloat(sale.paid_amount);
      await prisma.payment.create({
        data: {
          store_id: req.tenantId,
          sale_id: sale.id,
          amount: extraPaid,
          payment_method: data.payment_method || sale.payment_method,
          payment_date: new Date(),
        },
      });
    }

    const updated = await prisma.sale.findUnique({
      where: { id: sale.id },
      include: { customer: true, items: true, payments: true },
    });

    response.success(res, updated, 'Sale updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteSale = async (req, res, next) => {
  try {
    const sale = await prisma.sale.findFirst({
      where: { id: BigInt(req.params.id), store_id: req.tenantId },
      include: { items: true },
    });
    if (!sale) return response.notFound(res, 'Sale not found');

    if (sale.status === 'cancelled' || sale.status === 'refunded') {
      return response.error(res, 'Sale is already cancelled/refunded', 400);
    }

    await prisma.$transaction(async (tx) => {
      for (const item of sale.items) {
        const product = await tx.product.findUnique({ where: { id: item.product_id } });
        if (product && product.track_stock) {
          const newStock = parseFloat(product.stock_quantity) + parseFloat(item.quantity);
          await tx.product.update({
            where: { id: product.id },
            data: { stock_quantity: newStock },
          });
        }
      }

      await tx.sale.update({
        where: { id: sale.id },
        data: { status: 'cancelled', payment_status: 'refunded' },
      });
    });

    const updated = await prisma.sale.findUnique({ where: { id: sale.id } });
    response.success(res, updated, 'Sale cancelled and stock restored');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listSales,
  getSale,
  createSale,
  updateSale,
  deleteSale,
};
