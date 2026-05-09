const crypto = require('crypto');

const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    + '-' + Date.now().toString(36);
};

const generateReferenceNumber = (prefix) => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

const generateInvoiceNumber = (storeId) => {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `INV-${y}${m}${d}-${String(storeId).padStart(4, '0')}-${random}`;
};

const calculateTotals = (items, taxRate = 0, discountAmount = 0) => {
  let subtotal = 0;
  let totalTax = 0;

  items.forEach(item => {
    const itemTotal = parseFloat(item.quantity) * parseFloat(item.unit_price);
    const itemTax = itemTotal * (parseFloat(item.tax_percentage || taxRate) / 100);
    subtotal += itemTotal;
    totalTax += itemTax;
  });

  const totalAmount = subtotal + totalTax - parseFloat(discountAmount);

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax_amount: parseFloat(totalTax.toFixed(2)),
    discount_amount: parseFloat(discountAmount.toFixed(2)),
    total_amount: parseFloat(totalAmount.toFixed(2)),
  };
};

const paginate = (page = 1, limit = 20) => {
  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (p - 1) * l;
  return { page: p, limit: l, offset };
};

const getPaginationMeta = (count, page, limit) => {
  return {
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    hasMore: page * limit < count,
  };
};

const sanitizeHtml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

const parseJsonField = (field, defaultValue = {}) => {
  if (!field) return defaultValue;
  if (typeof field === 'object') return field;
  try {
    return JSON.parse(field);
  } catch {
    return defaultValue;
  }
};

module.exports = {
  generateSlug,
  generateReferenceNumber,
  generateInvoiceNumber,
  calculateTotals,
  paginate,
  getPaginationMeta,
  sanitizeHtml,
  parseJsonField,
};
