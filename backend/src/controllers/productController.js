const prisma = require('../prisma');
const response = require('../utils/response');
const { paginate, getPaginationMeta, generateSlug } = require('../utils/helpers');
const { generateBarcode } = require('../utils/generateBarcode');
const tenantService = require('../services/tenantService');
const notificationService = require('../services/notificationService');

const listProducts = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const {
      search, category_id, is_active, type, barcode, sku,
      low_stock, out_of_stock, requires_prescription, sort_by, sort_order,
      stockStatus, category,
    } = req.query;

    const where = { store_id: req.tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } },
        { manufacturer: { contains: search } },
      ];
    }
    if (category_id) where.category_id = BigInt(category_id);
    if (is_active !== undefined) where.is_active = is_active === 'true' || is_active === '1';
    if (type) where.type = type;
    if (barcode) where.barcode = barcode;
    if (sku) where.sku = sku;
    if (requires_prescription !== undefined) where.requires_prescription = requires_prescription === 'true';
    let isLowStock = false;
    if (stockStatus === 'low_stock') {
      where.stock_quantity = { gte: 1 };
      isLowStock = true;
    } else if (stockStatus === 'out_of_stock') {
      where.stock_quantity = { lte: 0 };
    } else if (stockStatus === 'in_stock') {
      where.stock_quantity = { gt: 0 };
    }

    if (out_of_stock === 'true') {
      where.stock_quantity = { lte: 0 };
    }

    if (category && category !== 'all') {
      where.category_id = BigInt(category);
    }

    const orderBy = {};
    if (sort_by) {
      orderBy[sort_by] = sort_order === 'desc' ? 'desc' : 'asc';
    } else {
      orderBy.name = 'asc';
    }

    const [count, rows] = await prisma.$transaction([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: { category: { select: { id: true, name: true } } },
        skip: offset,
        take: limit,
        orderBy,
      }),
    ]);

    if (low_stock === 'true' || isLowStock) {
      const filtered = rows.filter(p => parseFloat(p.stock_quantity) <= parseFloat(p.low_stock_threshold));
      response.paginated(res, filtered, getPaginationMeta(count, page, limit));
      return;
    }

    response.paginated(res, rows, getPaginationMeta(count, page, limit));
  } catch (error) {
    next(error);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: BigInt(req.params.id), store_id: req.tenantId },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });
    if (!product) return response.notFound(res, 'Product not found');
    response.success(res, product);
  } catch (error) {
    next(error);
  }
};

const getProductByBarcode = async (req, res, next) => {
  try {
    const { barcode } = req.params;
    const product = await prisma.product.findFirst({
      where: { store_id: req.tenantId, barcode },
      include: { category: { select: { id: true, name: true } } },
    });
    if (!product) return response.notFound(res, 'Product not found');
    response.success(res, product);
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const limit = await tenantService.checkProductLimit(req.tenantId);
    if (limit.isExceeded) {
      return response.error(res, 'Product limit reached. Upgrade your plan to add more products.', 403);
    }

    const {
      category_id, name, sku, barcode, barcode_type, description,
      purchase_price, selling_price, wholesale_price, discount_price,
      stock_quantity, low_stock_threshold, unit, tax_percentage,
      is_active, is_featured, track_stock, type,
      expiry_date, manufacturer, batch_number, requires_prescription, images,
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return response.error(res, 'Product name is required', 400);
    }
    if (name.trim().length > 200) {
      return response.error(res, 'Product name must be at most 200 characters', 400);
    }

    const slug = generateSlug(name);
    const productBarcode = barcode || generateBarcode(barcode_type || 'code128');

    const product = await prisma.product.create({
      data: {
        store_id: req.tenantId,
        category_id: category_id ? BigInt(category_id) : null,
        name,
        slug,
        sku: sku || null,
        barcode: productBarcode,
        barcode_type: barcode_type || 'code128',
        description: description || null,
        purchase_price: purchase_price || 0,
        selling_price: selling_price || 0,
        wholesale_price: wholesale_price || null,
        discount_price: discount_price || null,
        stock_quantity: stock_quantity || 0,
        low_stock_threshold: low_stock_threshold || 10,
        unit: unit || 'pcs',
        tax_percentage: tax_percentage || 0,
        images: images || [],
        is_active: is_active !== undefined ? is_active : true,
        is_featured: is_featured || false,
        track_stock: track_stock !== undefined ? track_stock : true,
        type: type || 'good',
        expiry_date: expiry_date ? new Date(expiry_date) : null,
        manufacturer: manufacturer || null,
        batch_number: batch_number || null,
        requires_prescription: requires_prescription || false,
      },
    });

    response.created(res, product, 'Product created successfully');
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: BigInt(req.params.id), store_id: req.tenantId },
    });
    if (!product) return response.notFound(res, 'Product not found');

    const allowedFields = [
      'category_id', 'name', 'sku', 'barcode', 'barcode_type', 'description',
      'purchase_price', 'selling_price', 'wholesale_price', 'discount_price',
      'stock_quantity', 'low_stock_threshold', 'unit', 'tax_percentage',
      'is_active', 'is_featured', 'track_stock', 'type',
      'expiry_date', 'manufacturer', 'batch_number', 'requires_prescription', 'images',
    ];

    const data = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    });

    if (data.name) {
      data.slug = generateSlug(data.name);
    }
    if (data.category_id) data.category_id = BigInt(data.category_id);
    if (data.expiry_date) data.expiry_date = new Date(data.expiry_date);

    if (Object.keys(data).length === 0) {
      return response.error(res, 'No valid fields to update', 400);
    }

    const updated = await prisma.product.update({
      where: { id: product.id },
      data,
      include: { category: { select: { id: true, name: true } } },
    });

    response.success(res, updated, 'Product updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: BigInt(req.params.id), store_id: req.tenantId },
    });
    if (!product) return response.notFound(res, 'Product not found');

    const [saleRefs, purchaseRefs] = await Promise.all([
      prisma.saleItem.count({ where: { product_id: product.id } }),
      prisma.purchaseItem.count({ where: { product_id: product.id } }),
    ]);
    if (saleRefs > 0 || purchaseRefs > 0) {
      return response.error(res, `Cannot delete: product is referenced in ${saleRefs} sale(s) and ${purchaseRefs} purchase(s). Deactivate it instead.`, 409);
    }

    await prisma.product.delete({ where: { id: product.id } });
    response.success(res, null, 'Product deleted successfully');
  } catch (error) {
    next(error);
  }
};

const adjustStock = async (req, res, next) => {
  try {
    const { quantity, reason } = req.body;
    const product = await prisma.product.findFirst({
      where: { id: BigInt(req.params.id), store_id: req.tenantId },
    });
    if (!product) return response.notFound(res, 'Product not found');

    if (!quantity || isNaN(quantity)) {
      return response.error(res, 'Valid quantity is required', 400);
    }

    const newQuantity = parseFloat(product.stock_quantity) + parseFloat(quantity);
    if (newQuantity < 0) {
      return response.error(res, 'Insufficient stock', 400);
    }

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: { stock_quantity: newQuantity },
    });

    if (updated.track_stock && newQuantity <= parseFloat(updated.low_stock_threshold)) {
      await notificationService.checkLowStock(req.tenantId, [updated]);
    }

    response.success(res, {
      product: { ...updated, stock_quantity: newQuantity },
      adjustment: parseFloat(quantity),
      reason: reason || 'manual adjustment',
    }, 'Stock adjusted successfully');
  } catch (error) {
    next(error);
  }
};

const bulkUpdateProducts = async (req, res, next) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return response.error(res, 'Products array is required', 400);
    }

    const results = [];
    for (const p of products) {
      try {
        const product = await prisma.product.findFirst({
          where: { id: BigInt(p.id), store_id: req.tenantId },
        });
        if (product) {
          const { id, ...updateData } = p;
          await prisma.product.update({ where: { id: product.id }, data: updateData });
          results.push({ id: p.id, status: 'updated' });
        } else {
          results.push({ id: p.id, status: 'not_found' });
        }
      } catch (err) {
        results.push({ id: p.id, status: 'error', message: err.message });
      }
    }

    response.success(res, results, 'Bulk update completed');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listProducts,
  getProduct,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  bulkUpdateProducts,
};
