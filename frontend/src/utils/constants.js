export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  STORE_OWNER: 'store_owner',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  OWNER: 'store_owner',
  CASHIER: 'employee',
  STAFF: 'employee',
};

export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  MOBILE_PAYMENT: 'mobile_payment',
  BANK_TRANSFER: 'bank_transfer',
  CREDIT: 'credit',
  OTHER: 'other',
};

export const SALE_STATUS = {
  COMPLETED: 'completed',
  PENDING: 'pending',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  ON_HOLD: 'on_hold',
};

export const PAYMENT_STATUS = {
  PAID: 'paid',
  PARTIAL: 'partial',
  UNPAID: 'unpaid',
  REFUNDED: 'refunded',
};

export const PRODUCT_UNITS = [
  'piece',
  'kg',
  'g',
  'lb',
  'oz',
  'liter',
  'ml',
  'gallon',
  'box',
  'pack',
  'bottle',
  'can',
  'bag',
  'carton',
  'dozen',
  'roll',
  'meter',
  'pair',
  'set',
  'strip',
  'tablet',
  'capsule',
  'vial',
  'tube',
];

export const BARCODE_TYPES = ['EAN13', 'EAN8', 'UPCA', 'UPCE', 'CODE128', 'CODE39', 'ITF'];

export const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: ['Up to 100 products', '1 user', 'Basic reports', 'Email support'],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 29,
    features: ['Up to 1000 products', '3 users', 'Sales reports', 'Inventory management', 'Email support'],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 79,
    features: ['Unlimited products', '10 users', 'Advanced reports', 'Pharmacy features', 'Barcode scanning', 'Priority support'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    features: ['Unlimited everything', 'Unlimited users', 'All features', 'API access', 'Custom integrations', 'Dedicated support'],
  },
];

export const STORE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  TRIAL: 'trial',
};

export const CHART_COLORS = {
  primary: '#4f46e5',
  secondary: '#64748b',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#8b5cf6',
  pink: '#ec4899',
  orange: '#f97316',
  teal: '#14b8a6',
  cyan: '#06b6d4',
};

export const CHART_COLOR_ARRAYS = {
  primary: ['#4f46e5', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'],
  success: ['#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7'],
  warm: ['#f59e0b', '#f97316', '#ef4444', '#ec4899', '#8b5cf6'],
  cool: ['#3b82f6', '#14b8a6', '#06b6d4', '#6366f1', '#8b5cf6'],
  default: ['#4f46e5', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'],
};
