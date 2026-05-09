const prisma = require('../prisma');

const getSalesReport = async (storeId, { startDate, endDate, groupBy = 'day', categoryId, customerId, paymentMethod }) => {
  const conditions = [`store_id = ${storeId}`];
  const params = [];

  if (startDate) { conditions.push(`created_at >= ?`); params.push(new Date(startDate)); }
  if (endDate) { conditions.push(`created_at <= ?`); params.push(new Date(endDate + 'T23:59:59.999Z')); }
  if (customerId) { conditions.push(`customer_id = ?`); params.push(BigInt(customerId)); }
  if (paymentMethod) { conditions.push(`payment_method = ?`); params.push(paymentMethod); }

  let dateFormat;
  switch (groupBy) {
    case 'year': dateFormat = '%Y'; break;
    case 'month': dateFormat = '%Y-%m'; break;
    case 'week': dateFormat = '%x-%v'; break;
    default: dateFormat = '%Y-%m-%d';
  }

  const whereClause = conditions.join(' AND ');
  const query = `
    SELECT DATE_FORMAT(created_at, '${dateFormat}') AS period,
           COUNT(id) AS total_orders,
           SUM(total_amount) AS total_revenue,
           SUM(tax_amount) AS total_tax,
           SUM(discount_amount) AS total_discount,
           SUM(paid_amount) AS total_paid,
           SUM(due_amount) AS total_due
    FROM sales
    WHERE ${whereClause} AND status NOT IN ('cancelled', 'refunded')
    GROUP BY period
    ORDER BY MIN(created_at) ASC
  `;

  const sales = await prisma.$queryRawUnsafe(query, ...params);

  const totals = sales.reduce((acc, row) => {
    acc.total_orders += parseInt(row.total_orders) || 0;
    acc.total_revenue += parseFloat(row.total_revenue) || 0;
    acc.total_tax += parseFloat(row.total_tax) || 0;
    acc.total_discount += parseFloat(row.total_discount) || 0;
    acc.total_paid += parseFloat(row.total_paid) || 0;
    acc.total_due += parseFloat(row.total_due) || 0;
    return acc;
  }, { total_orders: 0, total_revenue: 0, total_tax: 0, total_discount: 0, total_paid: 0, total_due: 0 });

  return { breakdown: sales, totals };
};

const getPurchaseReport = async (storeId, { startDate, endDate, groupBy = 'day', supplierId, status }) => {
  const conditions = [`store_id = ${storeId}`];
  const params = [];

  if (startDate) { conditions.push(`created_at >= ?`); params.push(new Date(startDate)); }
  if (endDate) { conditions.push(`created_at <= ?`); params.push(new Date(endDate + 'T23:59:59.999Z')); }
  if (supplierId) { conditions.push(`supplier_id = ?`); params.push(BigInt(supplierId)); }
  if (status) { conditions.push(`status = ?`); params.push(status); }

  let dateFormat;
  switch (groupBy) {
    case 'year': dateFormat = '%Y'; break;
    case 'month': dateFormat = '%Y-%m'; break;
    case 'week': dateFormat = '%x-%v'; break;
    default: dateFormat = '%Y-%m-%d';
  }

  const whereClause = conditions.join(' AND ');
  const query = `
    SELECT DATE_FORMAT(created_at, '${dateFormat}') AS period,
           COUNT(id) AS total_purchases,
           SUM(total_amount) AS total_amount,
           SUM(paid_amount) AS total_paid,
           SUM(due_amount) AS total_due
    FROM purchases
    WHERE ${whereClause} AND status NOT IN ('cancelled', 'returned')
    GROUP BY period
    ORDER BY MIN(created_at) ASC
  `;

  const purchases = await prisma.$queryRawUnsafe(query, ...params);

  const totals = purchases.reduce((acc, row) => {
    acc.total_purchases += parseInt(row.total_purchases) || 0;
    acc.total_amount += parseFloat(row.total_amount) || 0;
    acc.total_paid += parseFloat(row.total_paid) || 0;
    acc.total_due += parseFloat(row.total_due) || 0;
    return acc;
  }, { total_purchases: 0, total_amount: 0, total_paid: 0, total_due: 0 });

  return { breakdown: purchases, totals };
};

const getProfitLossReport = async (storeId, { startDate, endDate, groupBy = 'month' }) => {
  const conditions = [`store_id = ${storeId}`];
  const params = [];

  if (startDate) { conditions.push(`created_at >= ?`); params.push(new Date(startDate)); }
  if (endDate) { conditions.push(`created_at <= ?`); params.push(new Date(endDate + 'T23:59:59.999Z')); }

  let dateFormat;
  switch (groupBy) {
    case 'year': dateFormat = '%Y'; break;
    case 'week': dateFormat = '%x-%v'; break;
    default: dateFormat = '%Y-%m';
  }

  const whereClause = conditions.join(' AND ');

  const revenueQuery = `
    SELECT DATE_FORMAT(created_at, '${dateFormat}') AS period,
           SUM(total_amount) AS total_revenue
    FROM sales
    WHERE ${whereClause} AND status = 'completed'
    GROUP BY period
  `;

  const expenseQuery = `
    SELECT DATE_FORMAT(expense_date, '${dateFormat}') AS period,
           SUM(amount) AS total_expenses
    FROM expenses
    WHERE ${whereClause}
    GROUP BY period
  `;

  const costQuery = `
    SELECT DATE_FORMAT(p.created_at, '${dateFormat}') AS period,
           SUM(pi.quantity * pi.unit_price) AS total_cost
    FROM purchase_items pi
    JOIN purchases p ON p.id = pi.purchase_id
    WHERE p.store_id = ${storeId} AND p.status = 'received'
    GROUP BY period
  `;

  const [revenueData, expenseData, costData] = await Promise.all([
    prisma.$queryRawUnsafe(revenueQuery, ...params),
    prisma.$queryRawUnsafe(expenseQuery, ...params),
    prisma.$queryRawUnsafe(costQuery),
  ]);

  const periods = new Set();
  const revenueMap = {};
  const expenseMap = {};
  const costMap = {};

  revenueData.forEach(r => { periods.add(r.period); revenueMap[r.period] = parseFloat(r.total_revenue) || 0; });
  expenseData.forEach(e => { periods.add(e.period); expenseMap[e.period] = parseFloat(e.total_expenses) || 0; });
  costData.forEach(c => { periods.add(c.period); costMap[c.period] = parseFloat(c.total_cost) || 0; });

  const breakdown = Array.from(periods).sort().map(period => ({
    period,
    revenue: revenueMap[period] || 0,
    cost_of_goods: costMap[period] || 0,
    gross_profit: (revenueMap[period] || 0) - (costMap[period] || 0),
    expenses: expenseMap[period] || 0,
    net_profit: (revenueMap[period] || 0) - (costMap[period] || 0) - (expenseMap[period] || 0),
  }));

  const totals = breakdown.reduce((acc, row) => {
    acc.revenue += row.revenue;
    acc.cost_of_goods += row.cost_of_goods;
    acc.gross_profit += row.gross_profit;
    acc.expenses += row.expenses;
    acc.net_profit += row.net_profit;
    return acc;
  }, { revenue: 0, cost_of_goods: 0, gross_profit: 0, expenses: 0, net_profit: 0 });

  return { breakdown, totals };
};

const getInventoryReport = async (storeId) => {
  const products = await prisma.$queryRawUnsafe(`
    SELECT p.id, p.name, p.sku, p.barcode, p.stock_quantity, p.low_stock_threshold,
           p.purchase_price, p.selling_price, p.unit, p.is_active, p.category_id,
           c.name AS category_name,
           (p.stock_quantity * p.purchase_price) AS inventory_value,
           (p.stock_quantity * p.selling_price) AS inventory_value_sale,
           CASE WHEN p.stock_quantity <= p.low_stock_threshold THEN 1 ELSE 0 END AS is_low_stock
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.store_id = ${storeId}
    ORDER BY p.name ASC
  `);

  const stats = {
    total_products: products.length,
    total_stock: products.reduce((s, p) => s + parseFloat(p.stock_quantity || 0), 0),
    total_inventory_value: products.reduce((s, p) => s + parseFloat(p.inventory_value || 0), 0),
    total_inventory_value_sale: products.reduce((s, p) => s + parseFloat(p.inventory_value_sale || 0), 0),
    low_stock_count: products.filter(p => p.is_low_stock).length,
    out_of_stock: products.filter(p => parseFloat(p.stock_quantity) <= 0).length,
    active_products: products.filter(p => p.is_active).length,
  };

  return { products, stats };
};

const getTopSellingProducts = async (storeId, { startDate, endDate, limit = 10 }) => {
  const conditions = [`s.store_id = ${storeId}`, `s.status = 'completed'`];
  const params = [];

  if (startDate) { conditions.push(`s.created_at >= ?`); params.push(new Date(startDate)); }
  if (endDate) { conditions.push(`s.created_at <= ?`); params.push(new Date(endDate + 'T23:59:59.999Z')); }

  const whereClause = conditions.join(' AND ');
  const query = `
    SELECT si.product_id,
           p.name AS product_name,
           p.sku AS product_sku,
           p.selling_price,
           SUM(si.quantity) AS total_quantity,
           SUM(si.total) AS total_revenue
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    JOIN products p ON p.id = si.product_id
    WHERE ${whereClause}
    GROUP BY si.product_id
    ORDER BY total_quantity DESC
    LIMIT ${Math.min(limit, 100)}
  `;

  return await prisma.$queryRawUnsafe(query, ...params);
};

const getCustomerReport = async (storeId, { startDate, endDate }) => {
  const conditions = [`s.store_id = ${storeId}`, `s.status = 'completed'`, `s.customer_id IS NOT NULL`];
  const params = [];

  if (startDate) { conditions.push(`s.created_at >= ?`); params.push(new Date(startDate)); }
  if (endDate) { conditions.push(`s.created_at <= ?`); params.push(new Date(endDate + 'T23:59:59.999Z')); }

  const whereClause = conditions.join(' AND ');
  const query = `
    SELECT s.customer_id,
           c.name AS customer_name,
           c.email AS customer_email,
           c.phone AS customer_phone,
           COUNT(s.id) AS total_orders,
           SUM(s.total_amount) AS total_spent,
           SUM(s.paid_amount) AS total_paid
    FROM sales s
    LEFT JOIN customers c ON c.id = s.customer_id
    WHERE ${whereClause}
    GROUP BY s.customer_id
    ORDER BY total_spent DESC
    LIMIT 50
  `;

  return await prisma.$queryRawUnsafe(query, ...params);
};

const getExpenseReport = async (storeId, { startDate, endDate, groupBy = 'category' }) => {
  const conditions = [`store_id = ${storeId}`];
  const params = [];

  if (startDate) { conditions.push(`expense_date >= ?`); params.push(startDate); }
  if (endDate) { conditions.push(`expense_date <= ?`); params.push(endDate); }

  if (groupBy === 'month') {
    return getExpenseByMonth(storeId, startDate, endDate);
  }

  const groupField = groupBy === 'payment_method' ? 'payment_method' : 'category';
  const whereClause = conditions.join(' AND ');

  const query = `
    SELECT ${groupField},
           COUNT(id) AS count,
           SUM(amount) AS total
    FROM expenses
    WHERE ${whereClause}
    GROUP BY ${groupField}
  `;

  const expenses = await prisma.$queryRawUnsafe(query, ...params);
  const total = expenses.reduce((s, e) => s + parseFloat(e.total || 0), 0);
  return { breakdown: expenses, total };
};

const getExpenseByMonth = async (storeId, startDate, endDate) => {
  const conditions = [`store_id = ${storeId}`];
  const params = [];

  if (startDate) { conditions.push(`expense_date >= ?`); params.push(startDate); }
  if (endDate) { conditions.push(`expense_date <= ?`); params.push(endDate); }

  const whereClause = conditions.join(' AND ');
  const query = `
    SELECT DATE_FORMAT(expense_date, '%Y-%m') AS period,
           SUM(amount) AS total
    FROM expenses
    WHERE ${whereClause}
    GROUP BY period
    ORDER BY MIN(expense_date) ASC
  `;

  const expenses = await prisma.$queryRawUnsafe(query, ...params);
  const total = expenses.reduce((s, e) => s + parseFloat(e.total || 0), 0);
  return { breakdown: expenses, total };
};

module.exports = {
  getSalesReport,
  getPurchaseReport,
  getProfitLossReport,
  getInventoryReport,
  getTopSellingProducts,
  getCustomerReport,
  getExpenseReport,
};
