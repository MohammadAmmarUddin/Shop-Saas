const prisma = require('../prisma');
const response = require('../utils/response');
const { paginate, getPaginationMeta, generateReferenceNumber } = require('../utils/helpers');

const listPurchases = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const { search, status, payment_status, supplier_id, start_date, end_date } = req.query;
    const where = { store_id: req.tenantId };

    if (status) where.status = status;
    if (payment_status) where.payment_status = payment_status;
    if (supplier_id) where.supplier_id = BigInt(supplier_id);
    if (start_date) where.created_at = { gte: new Date(start_date) };
    if (end_date) where.created_at = { ...where.created_at, lte: new Date(end_date + 'T23:59:59.999Z') };
    if (search) {
      where.reference_number = { contains: search };
    }

    const [count, rows] = await prisma.$transaction([
      prisma.purchase.count({ where }),
      prisma.purchase.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true, phone: true } },
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

const getPurchase = async (req, res, next) => {
  try {
    const purchase = await prisma.purchase.findFirst({
      where: { id: BigInt(req.params.id), store_id: req.tenantId },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });
    if (!purchase) return response.notFound(res, 'Purchase not found');
    response.success(res, purchase);
  } catch (error) {
    next(error);
  }
};

const createPurchase = async (req, res, next) => {
  try {
    const {
      supplier_id, items, order_date, expected_date,
      discount_amount, shipping_amount, shipping_cost, status, notes,
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

    let subtotal = 0;
    let totalTax = 0;
    const purchaseItems = [];

    for (const item of items) {
      const product = productMap[item.product_id];
      if (!product) {
        return response.error(res, `Product ID ${item.product_id} not found`, 404);
      }

      const itemTotal = parseFloat(item.quantity) * parseFloat(item.unit_price);
      const itemTax = itemTotal * (parseFloat(item.tax_percentage || 0) / 100);
      const itemDiscount = parseFloat(item.discount_amount || 0);

      subtotal += itemTotal;
      totalTax += itemTax;

      purchaseItems.push({
        product_id: product.id,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price),
        discount_amount: itemDiscount,
        tax_percentage: parseFloat(item.tax_percentage || 0),
        tax_amount: itemTax,
        total: itemTotal + itemTax - itemDiscount,
      });
    }

    const discAmount = parseFloat(discount_amount || 0);
    const shipAmount = parseFloat(shipping_cost || shipping_amount || 0);
    const totalAmount = subtotal + totalTax - discAmount + shipAmount;

    const refNumber = generateReferenceNumber('PO');

    const purchase = await prisma.$transaction(async (tx) => {
      const p = await tx.purchase.create({
        data: {
          store_id: req.tenantId,
          supplier_id: supplier_id ? BigInt(supplier_id) : null,
          user_id: req.user.id,
          purchase_number: refNumber,
          order_date: order_date ? new Date(order_date) : new Date(),
          expected_date: expected_date ? new Date(expected_date) : null,
          subtotal: parseFloat(subtotal.toFixed(2)),
          tax_amount: parseFloat(totalTax.toFixed(2)),
          discount_amount: discAmount,
          shipping_cost: shipAmount,
          total_amount: parseFloat(totalAmount.toFixed(2)),
          paid_amount: 0,
          due_amount: parseFloat(totalAmount.toFixed(2)),
          payment_status: 'unpaid',
          status: status || 'pending',
          notes: notes || null,
          items: {
            create: purchaseItems.map(pi => ({
              product_id: pi.product_id,
              quantity: pi.quantity,
              unit_price: pi.unit_price,
              discount_amount: pi.discount_amount,
              tax_percentage: pi.tax_percentage,
              tax_amount: pi.tax_amount,
              total: pi.total,
            })),
          },
        },
        include: { items: true },
      });

      return p;
    });

    const created = await prisma.purchase.findUnique({
      where: { id: purchase.id },
      include: { supplier: true, items: true },
    });

    response.created(res, created, 'Purchase created successfully');
  } catch (error) {
    next(error);
  }
};

const updatePurchase = async (req, res, next) => {
  try {
    const purchase = await prisma.purchase.findFirst({
      where: { id: BigInt(req.params.id), store_id: req.tenantId },
    });
    if (!purchase) return response.notFound(res, 'Purchase not found');

    const allowedFields = ['supplier_id', 'order_date', 'expected_date', 'status', 'notes', 'payment_status', 'paid_amount'];
    const data = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    });

    if (data.paid_amount !== undefined) {
      data.due_amount = parseFloat(purchase.total_amount) - parseFloat(data.paid_amount);
      if (data.due_amount <= 0) data.payment_status = 'paid';
    }

    if (Object.keys(data).length === 0) {
      return response.error(res, 'No valid fields to update', 400);
    }

    const updated = await prisma.purchase.update({
      where: { id: purchase.id },
      data,
    });
    response.success(res, updated, 'Purchase updated successfully');
  } catch (error) {
    next(error);
  }
};

const receivePurchase = async (req, res, next) => {
  try {
    const purchase = await prisma.purchase.findFirst({
      where: { id: BigInt(req.params.id), store_id: req.tenantId },
      include: { items: true },
    });
    if (!purchase) return response.notFound(res, 'Purchase not found');

    if (purchase.status === 'received') {
      return response.error(res, 'Purchase already received', 400);
    }

    const { items } = req.body;
    if (!items || items.length === 0) {
      return response.error(res, 'Items with received quantities are required', 400);
    }

    const itemMap = {};
    purchase.items.forEach(item => { itemMap[item.id.toString()] = item; });

    await prisma.$transaction(async (tx) => {
      for (const ri of items) {
        const purchaseItem = itemMap[ri.id];
        if (!purchaseItem) {
          throw Object.assign(new Error(`Purchase item ${ri.id} not found`), { statusCode: 404 });
        }

        const receivedQty = parseFloat(ri.received_quantity || 0);
        await tx.purchaseItem.update({
          where: { id: purchaseItem.id },
          data: {
            received_quantity: receivedQty,
            expiry_date: ri.expiry_date ? new Date(ri.expiry_date) : purchaseItem.expiry_date,
            batch_number: ri.batch_number || purchaseItem.batch_number,
          },
        });

        const product = await tx.product.findUnique({ where: { id: purchaseItem.product_id } });
        if (product) {
          const newStock = parseFloat(product.stock_quantity) + receivedQty;
          await tx.product.update({
            where: { id: product.id },
            data: {
              stock_quantity: newStock,
              purchase_price: parseFloat(purchaseItem.unit_price),
              ...(ri.expiry_date ? { expiry_date: new Date(ri.expiry_date) } : {}),
              ...(ri.batch_number ? { batch_number: ri.batch_number } : {}),
            },
          });
        }
      }

      await tx.purchase.update({
        where: { id: purchase.id },
        data: { status: 'received' },
      });
    });

    const updated = await prisma.purchase.findUnique({
      where: { id: purchase.id },
      include: { supplier: true, items: true },
    });

    response.success(res, updated, 'Purchase received and stock updated');
  } catch (error) {
    next(error);
  }
};

const deletePurchase = async (req, res, next) => {
  try {
    const purchase = await prisma.purchase.findFirst({
      where: { id: BigInt(req.params.id), store_id: req.tenantId },
    });
    if (!purchase) return response.notFound(res, 'Purchase not found');

    await prisma.$transaction(async (tx) => {
      if (purchase.status === 'received') {
        const items = await tx.purchaseItem.findMany({ where: { purchase_id: purchase.id } });
        for (const item of items) {
          const product = await tx.product.findUnique({ where: { id: item.product_id } });
          if (product) {
            const newStock = parseFloat(product.stock_quantity) - parseFloat(item.received_quantity);
            await tx.product.update({
              where: { id: product.id },
              data: { stock_quantity: Math.max(0, newStock) },
            });
          }
        }
      }

      await tx.purchaseItem.deleteMany({ where: { purchase_id: purchase.id } });
      await tx.purchase.delete({ where: { id: purchase.id } });
    });

    response.success(res, null, 'Purchase deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listPurchases,
  getPurchase,
  createPurchase,
  updatePurchase,
  receivePurchase,
  deletePurchase,
};
