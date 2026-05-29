const prisma = require('../prisma');

const RESOURCE_MAP = {
  products:   { model: 'product',       labelField: 'name',           href: id => `/api/products/${id}`,           scope: 'store_id' },
  categories: { model: 'category',      labelField: 'name',           href: id => `/api/categories/${id}`,         scope: 'store_id' },
  customers:  { model: 'customer',      labelField: 'name',           href: id => `/api/customers/${id}`,          scope: 'store_id' },
  suppliers:  { model: 'supplier',      labelField: 'name',           href: id => `/api/suppliers/${id}`,          scope: 'store_id' },
  sales:      { model: 'sale',          labelField: 'invoice_number', href: id => `/api/sales/${id}`,              scope: 'store_id' },
  purchases:  { model: 'purchase',      labelField: 'purchase_number',href: id => `/api/purchases/${id}`,           scope: 'store_id' },
  expenses:   { model: 'expense',       labelField: 'id',             href: id => `/api/expenses/${id}`,           scope: 'store_id' },
  users:      { model: 'user',          labelField: 'name',           href: id => `/api/users/${id}`,              scope: 'store_id' },
  tenants:    { model: 'store',         labelField: 'name',           href: id => `/api/admin/tenants/${id}`                          },
  payments:   { model: 'manualPayment', labelField: 'id',             href: id => `/api/admin/tenants/payments/${id}`                },
  stores:     { model: 'store',         labelField: 'name',           href: () => '/api/stores'                                       },
};

const STATIC_CRUMBS = {
  dashboard:      { label: 'Dashboard',    href: '/api/dashboard/stats' },
  products:       { label: 'Products',     href: '/api/products' },
  categories:     { label: 'Categories',   href: '/api/categories' },
  customers:      { label: 'Customers',    href: '/api/customers' },
  suppliers:      { label: 'Suppliers',    href: '/api/suppliers' },
  sales:          { label: 'Sales',        href: '/api/sales' },
  purchases:      { label: 'Purchases',    href: '/api/purchases' },
  expenses:       { label: 'Expenses',     href: '/api/expenses' },
  users:          { label: 'Users',        href: '/api/users' },
  stores:         { label: 'Settings',     href: '/api/stores' },
  reports:        { label: 'Reports',      href: '/api/reports' },
  subscriptions:  { label: 'Subscription', href: '/api/subscriptions' },
  plans:          { label: 'Plans',        href: '/api/subscriptions/plans' },
  notifications:  { label: 'Notifications',href: '/api/notifications' },
  backup:         { label: 'Backup',       href: '/api/backup' },
  admin:          { label: 'Admin',        href: '/api/admin/tenants' },
  tenants:        { label: 'Tenants',      href: '/api/admin/tenants' },
  gateways:       { label: 'Gateways',     href: '/api/admin/tenants/gateways' },
  payments:       { label: 'Payments',     href: '/api/admin/tenants/payments' },
  settings:       { label: 'Settings',     href: '/api/stores/settings' },
};

const REPORT_SUB_PAGES = {
  sales:     { label: 'Sales',        href: '/api/reports/sales' },
  purchases: { label: 'Purchases',    href: '/api/reports/purchases' },
  inventory: { label: 'Inventory',    href: '/api/reports/inventory' },
  customers: { label: 'Customers',    href: '/api/reports/customers' },
  expenses:  { label: 'Expenses',     href: '/api/reports/expenses' },
  'profit-loss': { label: 'Profit & Loss',  href: '/api/reports/profit-loss' },
  'top-products': { label: 'Top Products',  href: '/api/reports/top-products' },
  export:        { label: 'Export',          href: '/api/reports/export' },
};

function normalizePath(url) {
  return url.split('?')[0].replace(/\/+$/, '');
}

function isNumericId(segment) {
  return /^\d+$/.test(segment);
}

async function resolveBreadcrumb(resource, id, req) {
  const config = RESOURCE_MAP[resource];
  if (!config) return null;

  const bigintId = BigInt(id);
  const where = { id: bigintId };
  if (config.scope && req.tenantId) {
    where[config.scope] = req.tenantId;
  }

  try {
    const record = await prisma[config.model].findFirst({
      where,
      select: { [config.labelField]: true },
    });
    if (!record) return null;
    return { label: String(record[config.labelField]), href: config.href(id) };
  } catch {
    return null;
  }
}

function buildPath(key, segments) {
  if (key === 'settings' && segments[1] === 'stores') return '/api/stores/settings';
  if (key === 'payments' || key === 'gateways') return `/api/admin/tenants/${key}`;
  return `/api/${key}`;
}

async function getBreadcrumbs(req) {
  const path = normalizePath(req.originalUrl);
  const segments = path.split('/').filter(Boolean);

  if (segments.length < 2 || segments[0] !== 'api') return [];

  const crumbs = [];

  // ── Admin /api/admin/... ──
  if (segments[1] === 'admin') {
    crumbs.push(STATIC_CRUMBS.admin);
    crumbs.push(STATIC_CRUMBS.tenants);

    const sub = segments[3];
    if (sub === 'payments' || sub === 'gateways') {
      crumbs.push(STATIC_CRUMBS[sub]);
      return crumbs;
    }

    if (isNumericId(segments[segments.length - 1])) {
      const detail = await resolveBreadcrumb('tenants', segments[segments.length - 1], req);
      if (detail) crumbs.push(detail);
    }
    return crumbs;
  }

  // ── Dashboard ──
  if (segments[1] === 'dashboard') {
    crumbs.push(STATIC_CRUMBS.dashboard);
    return crumbs;
  }

  // ── Reports ──
  if (segments[1] === 'reports') {
    crumbs.push(STATIC_CRUMBS.dashboard);
    crumbs.push(STATIC_CRUMBS.reports);
    const sub = segments[2];
    if (sub && REPORT_SUB_PAGES[sub]) {
      crumbs.push(REPORT_SUB_PAGES[sub]);
    }
    return crumbs;
  }

  // ── Subscriptions ──
  if (segments[1] === 'subscriptions') {
    crumbs.push(STATIC_CRUMBS.dashboard);
    crumbs.push(STATIC_CRUMBS.subscriptions);
    const sub = segments[2];
    if (sub === 'plans' || sub === 'payments') {
      crumbs.push(STATIC_CRUMBS[sub]);
    }
    return crumbs;
  }

  // ── Standard CRUD: /api/{resource}[/{id}] ──
  const resource = segments[1];
  const staticCrumb = STATIC_CRUMBS[resource];
  if (!staticCrumb) return [];

  crumbs.push(STATIC_CRUMBS.dashboard);
  crumbs.push(staticCrumb);

  // /api/stores/settings
  if (resource === 'stores' && segments[2] === 'settings') {
    crumbs.pop();
    crumbs.push(STATIC_CRUMBS.settings);
    return crumbs;
  }

  const last = segments[segments.length - 1];
  if (isNumericId(last)) {
    const detail = await resolveBreadcrumb(resource, last, req);
    if (detail) crumbs.push(detail);
  }

  return crumbs;
}

module.exports = { getBreadcrumbs };
