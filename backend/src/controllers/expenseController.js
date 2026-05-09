const prisma = require('../prisma');
const response = require('../utils/response');
const { paginate, getPaginationMeta } = require('../utils/helpers');

const listExpenses = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const { search, category, payment_method, start_date, end_date } = req.query;
    const where = { store_id: req.tenantId };

    if (category) where.category = category;
    if (payment_method) where.payment_method = payment_method;
    if (start_date) where.expense_date = { gte: new Date(start_date) };
    if (end_date) where.expense_date = { ...where.expense_date, lte: new Date(end_date) };
    if (search) {
      where.OR = [
        { description: { contains: search } },
        { reference_number: { contains: search } },
      ];
    }

    const [count, rows] = await prisma.$transaction([
      prisma.expense.count({ where }),
      prisma.expense.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: [{ expense_date: 'desc' }, { created_at: 'desc' }],
      }),
    ]);

    const totals = await prisma.expense.aggregate({
      where,
      _sum: { amount: true },
      _count: { id: true },
    });

    response.paginated(res, {
      expenses: rows,
      summary: {
        total_amount: totals._sum.amount || 0,
        total_count: totals._count.id || 0,
      },
    }, getPaginationMeta(count, page, limit));
  } catch (error) {
    next(error);
  }
};

const getExpense = async (req, res, next) => {
  try {
    const expense = await prisma.expense.findFirst({
      where: { id: BigInt(req.params.id), store_id: req.tenantId },
    });
    if (!expense) return response.notFound(res, 'Expense not found');
    response.success(res, expense);
  } catch (error) {
    next(error);
  }
};

const createExpense = async (req, res, next) => {
  try {
    const {
      category, amount, description, reference_number,
      expense_date, payment_method, is_recurring, recurring_frequency, recurring_end_date,
    } = req.body;

    if (!category || !amount) {
      return response.error(res, 'Category and amount are required', 400);
    }

    const expense = await prisma.expense.create({
      data: {
        store_id: req.tenantId,
        user_id: req.user.id,
        category,
        amount: parseFloat(amount),
        description: description || null,
        reference_number: reference_number || null,
        expense_date: expense_date ? new Date(expense_date) : new Date(),
        payment_method: payment_method || 'cash',
        is_recurring: is_recurring || false,
        recurring_frequency: recurring_frequency || null,
        recurring_end_date: recurring_end_date ? new Date(recurring_end_date) : null,
      },
    });

    response.created(res, expense, 'Expense created successfully');
  } catch (error) {
    next(error);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const expense = await prisma.expense.findFirst({
      where: { id: BigInt(req.params.id), store_id: req.tenantId },
    });
    if (!expense) return response.notFound(res, 'Expense not found');

    const allowedFields = [
      'category', 'amount', 'description', 'reference_number',
      'expense_date', 'payment_method', 'is_recurring', 'recurring_frequency', 'recurring_end_date',
    ];

    const data = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    });
    if (data.expense_date) data.expense_date = new Date(data.expense_date);
    if (data.recurring_end_date) data.recurring_end_date = new Date(data.recurring_end_date);

    if (Object.keys(data).length === 0) {
      return response.error(res, 'No valid fields to update', 400);
    }

    const updated = await prisma.expense.update({
      where: { id: expense.id },
      data,
    });
    response.success(res, updated, 'Expense updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    const expense = await prisma.expense.findFirst({
      where: { id: BigInt(req.params.id), store_id: req.tenantId },
    });
    if (!expense) return response.notFound(res, 'Expense not found');
    await prisma.expense.delete({ where: { id: expense.id } });
    response.success(res, null, 'Expense deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getExpenseCategories = async (req, res, next) => {
  try {
    const result = await prisma.expense.findMany({
      where: { store_id: req.tenantId },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    response.success(res, result.map(r => r.category));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseCategories,
};
