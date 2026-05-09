const prisma = require('../prisma');
const response = require('../utils/response');

const getDashboardStats = async (req, res, next) => {
  try {
    const storeId = req.tenantId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay());
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisYear = new Date(today.getFullYear(), 0, 1);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const [todaySalesAgg, weekSalesAgg, monthSalesAgg, yearSalesAgg,
      todayPurchasesAgg, monthPurchasesAgg,
      todayExpensesAgg, monthExpensesAgg,
      productCount, customerCount, supplierCount,
      recentSales, lowStockProducts, topProducts] = await Promise.all([

      prisma.sale.aggregate({
        where: { store_id: storeId, status: 'completed', created_at: { gte: today } },
        _sum: { total_amount: true },
        _count: { id: true },
      }),
      prisma.sale.aggregate({
        where: { store_id: storeId, status: 'completed', created_at: { gte: thisWeek } },
        _sum: { total_amount: true },
        _count: { id: true },
      }),
      prisma.sale.aggregate({
        where: { store_id: storeId, status: 'completed', created_at: { gte: thisMonth } },
        _sum: { total_amount: true },
        _count: { id: true },
      }),
      prisma.sale.aggregate({
        where: { store_id: storeId, status: 'completed', created_at: { gte: thisYear } },
        _sum: { total_amount: true },
        _count: { id: true },
      }),

      prisma.purchase.aggregate({
        where: { store_id: storeId, status: 'received', created_at: { gte: today } },
        _sum: { total_amount: true },
      }),
      prisma.purchase.aggregate({
        where: { store_id: storeId, status: 'received', created_at: { gte: thisMonth } },
        _sum: { total_amount: true },
      }),

      prisma.expense.aggregate({
        where: { store_id: storeId, expense_date: { gte: today } },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { store_id: storeId, expense_date: { gte: thisMonth } },
        _sum: { amount: true },
      }),

      prisma.product.count({ where: { store_id: storeId } }),
      prisma.customer.count({ where: { store_id: storeId, is_active: true } }),
      prisma.supplier.count({ where: { store_id: storeId, is_active: true } }),

      prisma.sale.findMany({
        where: { store_id: storeId, status: 'completed' },
        include: { items: true },
        orderBy: { created_at: 'desc' },
        take: 10,
      }),

      prisma.product.findMany({
        where: {
          store_id: storeId,
          track_stock: true,
          is_active: true,
          stock_quantity: { lte: 0 },
        },
        take: 10,
      }),
      prisma.$queryRaw`
        SELECT si.product_id, p.name, SUM(si.quantity) as total_sold, SUM(si.total) as total_revenue
        FROM sale_items si
        JOIN sales s ON s.id = si.sale_id
        JOIN products p ON p.id = si.product_id
        WHERE s.store_id = ${storeId} AND s.status = 'completed'
        GROUP BY si.product_id, p.name
        ORDER BY total_sold DESC
        LIMIT 10
      `,
    ]);

    const stats = {
      sales: {
        today: { total: Number(todaySalesAgg._sum.total_amount || 0), count: todaySalesAgg._count.id || 0 },
        this_week: { total: Number(weekSalesAgg._sum.total_amount || 0), count: weekSalesAgg._count.id || 0 },
        this_month: { total: Number(monthSalesAgg._sum.total_amount || 0), count: monthSalesAgg._count.id || 0 },
        this_year: { total: Number(yearSalesAgg._sum.total_amount || 0), count: yearSalesAgg._count.id || 0 },
      },
      purchases: {
        today: Number(todayPurchasesAgg._sum.total_amount || 0),
        this_month: Number(monthPurchasesAgg._sum.total_amount || 0),
      },
      expenses: {
        today: Number(todayExpensesAgg._sum.amount || 0),
        this_month: Number(monthExpensesAgg._sum.amount || 0),
      },
      products: { total: productCount },
      customers: customerCount,
      suppliers: supplierCount,
    };

    const mappedTopProducts = (topProducts || []).map(row => ({
      name: row.name,
      total_sold: Number(row.total_sold || 0),
      total_revenue: Number(row.total_revenue || 0),
    }));

    response.success(res, { stats, recent_sales: recentSales, low_stock_products: lowStockProducts, top_products: mappedTopProducts });
  } catch (error) {
    next(error);
  }
};

const getChartData = async (req, res, next) => {
  try {
    const storeId = req.tenantId;
    const { period = 'month' } = req.query;

    const startDate = new Date();
    if (period === 'year') startDate.setFullYear(startDate.getFullYear() - 10);
    else if (period === 'week') startDate.setDate(startDate.getDate() - 7);
    else startDate.setMonth(startDate.getMonth() - 6);

    const sales = await prisma.sale.findMany({
      where: { store_id: storeId, status: 'completed', created_at: { gte: startDate } },
      orderBy: { created_at: 'asc' },
      select: { total_amount: true, created_at: true },
    });

    const purchases = await prisma.purchase.findMany({
      where: { store_id: storeId, status: 'received', created_at: { gte: startDate } },
      orderBy: { created_at: 'asc' },
      select: { total_amount: true, created_at: true },
    });

    const expenses = await prisma.expense.findMany({
      where: { store_id: storeId, expense_date: { gte: startDate } },
      orderBy: { expense_date: 'asc' },
      select: { amount: true, expense_date: true },
    });

    const formatPeriod = (date) => {
      const d = new Date(date);
      if (period === 'year') return `${d.getFullYear()}`;
      if (period === 'week') {
        const start = new Date(d);
        start.setDate(d.getDate() - d.getDay());
        return `${start.getFullYear()}-W${String(Math.ceil((start.getDate()) / 7)).padStart(2, '0')}`;
      }
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    const aggregateByPeriod = (items, dateField) => {
      const map = {};
      items.forEach(item => {
        const p = formatPeriod(item[dateField]);
        map[p] = (map[p] || 0) + Number(item.total_amount || item.amount || 0);
      });
      return Object.entries(map).map(([period, total]) => ({ period, total: total.toString() }));
    };

    response.success(res, {
      sales: aggregateByPeriod(sales, 'created_at'),
      purchases: aggregateByPeriod(purchases, 'created_at'),
      expenses: aggregateByPeriod(expenses, 'expense_date'),
    });
  } catch (error) {
    next(error);
  }
};

const getRecentActivity = async (req, res, next) => {
  try {
    const storeId = req.tenantId;
    const limit = parseInt(req.query.limit) || 10;

    const [recentSales, recentPurchases, recentExpenses] = await Promise.all([
      prisma.sale.findMany({ where: { store_id: storeId }, orderBy: { created_at: 'desc' }, take: limit }),
      prisma.purchase.findMany({ where: { store_id: storeId }, orderBy: { created_at: 'desc' }, take: limit }),
      prisma.expense.findMany({ where: { store_id: storeId }, orderBy: { expense_date: 'desc' }, take: limit }),
    ]);

    const activities = [
      ...recentSales.map(s => ({
        type: 'sale', id: s.id, reference: s.invoice_number, amount: s.total_amount,
        status: s.status, created_at: s.created_at, createdAt: s.created_at,
        message: `Sale #${s.invoice_number || s.id} completed`,
      })),
      ...recentPurchases.map(p => ({
        type: 'purchase', id: p.id, reference: p.purchase_number, amount: p.total_amount,
        status: p.status, created_at: p.created_at, createdAt: p.created_at,
        message: `Purchase ${p.purchase_number || p.id} received`,
      })),
      ...recentExpenses.map(e => ({
        type: 'expense', id: e.id, category: e.category, amount: e.amount,
        created_at: e.expense_date, createdAt: e.expense_date,
        message: `${e.category || 'Expense'} of ${e.amount}`,
      })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, limit);

    response.success(res, activities);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats, getChartData, getRecentActivity,
};
