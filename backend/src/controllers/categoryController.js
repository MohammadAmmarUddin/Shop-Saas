const prisma = require('../prisma');
const response = require('../utils/response');
const { paginate, getPaginationMeta, generateSlug } = require('../utils/helpers');

const listCategories = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const { search, is_active } = req.query;
    const where = { store_id: req.tenantId };

    if (search) {
      where.name = { contains: search };
    }
    if (is_active !== undefined) {
      where.is_active = is_active === 'true' || is_active === '1';
    }

    const [count, rows] = await prisma.$transaction([
      prisma.category.count({ where }),
      prisma.category.findMany({
        where,
        include: { parent: { select: { id: true, name: true } } },
        skip: offset,
        take: limit,
        orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      }),
    ]);

    const categoriesWithCount = await Promise.all(rows.map(async (category) => {
      const productCount = await prisma.product.count({ where: { category_id: category.id } });
      return { ...category, product_count: productCount };
    }));

    response.paginated(res, categoriesWithCount, getPaginationMeta(count, page, limit));
  } catch (error) {
    next(error);
  }
};

const getAllCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { store_id: req.tenantId, is_active: true },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
    });
    response.success(res, categories);
  } catch (error) {
    next(error);
  }
};

const getCategory = async (req, res, next) => {
  try {
    const category = await prisma.category.findFirst({
      where: { id: BigInt(req.params.id), store_id: req.tenantId },
      include: { children: { select: { id: true, name: true, slug: true } } },
    });
    if (!category) return response.notFound(res, 'Category not found');

    const productCount = await prisma.product.count({ where: { category_id: category.id } });
    response.success(res, { ...category, product_count: productCount });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, description, parent_id, sort_order, is_active } = req.body;
    const slug = generateSlug(name);

    const existing = await prisma.category.findFirst({
      where: { store_id: req.tenantId, slug },
    });
    if (existing) return response.error(res, 'Category with this name already exists', 409);

    const category = await prisma.category.create({
      data: {
        store_id: req.tenantId,
        name,
        slug,
        description,
        parent_id: parent_id ? BigInt(parent_id) : null,
        sort_order: sort_order || 0,
        is_active: is_active !== undefined ? is_active : true,
      },
    });

    response.created(res, category, 'Category created successfully');
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await prisma.category.findFirst({
      where: { id: BigInt(req.params.id), store_id: req.tenantId },
    });
    if (!category) return response.notFound(res, 'Category not found');

    const { name, description, parent_id, sort_order, is_active } = req.body;
    const data = {};

    if (name !== undefined) {
      data.name = name;
      data.slug = generateSlug(name);
    }
    if (description !== undefined) data.description = description;
    if (parent_id !== undefined) data.parent_id = parent_id ? BigInt(parent_id) : null;
    if (sort_order !== undefined) data.sort_order = sort_order;
    if (is_active !== undefined) data.is_active = is_active;

    if (data.parent_id) {
      if (BigInt(parent_id) === category.id) {
        return response.error(res, 'Category cannot be its own parent', 400);
      }
    }

    const updated = await prisma.category.update({
      where: { id: category.id },
      data,
    });
    response.success(res, updated, 'Category updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const category = await prisma.category.findFirst({
      where: { id: BigInt(req.params.id), store_id: req.tenantId },
    });
    if (!category) return response.notFound(res, 'Category not found');

    const productCount = await prisma.product.count({ where: { category_id: category.id } });
    if (productCount > 0) {
      return response.error(res, `Cannot delete category. ${productCount} product(s) are assigned to it.`, 400);
    }

    await prisma.category.updateMany({
      where: { parent_id: category.id },
      data: { parent_id: null },
    });

    await prisma.category.delete({ where: { id: category.id } });
    response.success(res, null, 'Category deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listCategories,
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
