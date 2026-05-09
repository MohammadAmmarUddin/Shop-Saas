const ROLES = {
  SUPER_ADMIN: 'super_admin',
  STORE_OWNER: 'store_owner',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
};

const PERMISSIONS = {
  PRODUCTS: {
    CREATE: 'products.create',
    READ: 'products.read',
    UPDATE: 'products.update',
    DELETE: 'products.delete',
    IMPORT: 'products.import',
    EXPORT: 'products.export',
  },
  SALES: {
    CREATE: 'sales.create',
    READ: 'sales.read',
    UPDATE: 'sales.update',
    DELETE: 'sales.delete',
    REFUND: 'sales.refund',
  },
  PURCHASES: {
    CREATE: 'purchases.create',
    READ: 'purchases.read',
    UPDATE: 'purchases.update',
    DELETE: 'purchases.delete',
  },
  CUSTOMERS: {
    CREATE: 'customers.create',
    READ: 'customers.read',
    UPDATE: 'customers.update',
    DELETE: 'customers.delete',
  },
  SUPPLIERS: {
    CREATE: 'suppliers.create',
    READ: 'suppliers.read',
    UPDATE: 'suppliers.update',
    DELETE: 'suppliers.delete',
  },
  EXPENSES: {
    CREATE: 'expenses.create',
    READ: 'expenses.read',
    UPDATE: 'expenses.update',
    DELETE: 'expenses.delete',
  },
  REPORTS: {
    VIEW: 'reports.view',
    EXPORT: 'reports.export',
  },
  USERS: {
    CREATE: 'users.create',
    READ: 'users.read',
    UPDATE: 'users.update',
    DELETE: 'users.delete',
  },
  SETTINGS: {
    READ: 'settings.read',
    UPDATE: 'settings.update',
  },
  BACKUP: {
    CREATE: 'backup.create',
    RESTORE: 'backup.restore',
    DOWNLOAD: 'backup.download',
  },
};

const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS).flatMap(p => Object.values(p)),
  [ROLES.STORE_OWNER]: Object.values(PERMISSIONS).flatMap(p => Object.values(p)),
  [ROLES.MANAGER]: [
    ...Object.values(PERMISSIONS.PRODUCTS),
    ...Object.values(PERMISSIONS.SALES),
    ...Object.values(PERMISSIONS.PURCHASES),
    ...Object.values(PERMISSIONS.CUSTOMERS),
    ...Object.values(PERMISSIONS.SUPPLIERS),
    ...Object.values(PERMISSIONS.EXPENSES),
    ...Object.values(PERMISSIONS.REPORTS),
    PERMISSIONS.USERS.READ,
    PERMISSIONS.SETTINGS.READ,
  ],
  [ROLES.EMPLOYEE]: [
    PERMISSIONS.PRODUCTS.READ,
    PERMISSIONS.SALES.CREATE,
    PERMISSIONS.SALES.READ,
    PERMISSIONS.CUSTOMERS.CREATE,
    PERMISSIONS.CUSTOMERS.READ,
    PERMISSIONS.CUSTOMERS.UPDATE,
    PERMISSIONS.EXPENSES.CREATE,
    PERMISSIONS.EXPENSES.READ,
  ],
};

const hasPermission = (user, permission) => {
  if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.STORE_OWNER) {
    return true;
  }
  const userPermissions = user.permissions || {};
  const rolePerms = ROLE_PERMISSIONS[user.role] || [];
  return rolePerms.includes(permission) || userPermissions[permission] === true;
};

const checkPermission = (permission) => {
  return (req, res, next) => {
    if (hasPermission(req.user, permission)) {
      return next();
    }
    return res.status(403).json({ error: 'Insufficient permissions.' });
  };
};

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  checkPermission,
};
