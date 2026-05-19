/**
 * Constantes globales — PracticaYoruba
 */

// API endpoints base
export const API_BASE = process.env.API_URL || 'http://localhost:8000';

// Paginación por defecto
export const DEFAULT_PAGE_SIZE = 20;

// Estados de orden (deben coincidir con el backend)
export const ORDER_STATUS = {
  PENDING:         'PENDING',
  IN_PREPARATION:  'IN_PREPARATION',
  SHIPPED:         'SHIPPED',
  DELIVERED:       'DELIVERED',
  CANCELLED:       'CANCELLED',
};

export const ORDER_STATUS_LABELS = {
  PENDING:        'Pendiente',
  IN_PREPARATION: 'En preparación',
  SHIPPED:        'Enviado',
  DELIVERED:      'Entregado',
  CANCELLED:      'Cancelado',
};

// Estados de pago
export const PAYMENT_STATUS = {
  PENDING:   'PENDING',
  CONFIRMED: 'CONFIRMED',
  FAILED:    'FAILED',
  REFUNDED:  'REFUNDED',
};

// Gateways de pago soportados
export const PAYMENT_GATEWAY = {
  MERCADOPAGO: 'MERCADOPAGO',
  PAYPAL:      'PAYPAL',
};

// Tipos de voucher
export const VOUCHER_TYPE = {
  PERCENT: 'PERCENT',
  FIXED:   'FIXED',
};

// Países soportados (MVP: solo México)
export const COUNTRIES = [
  { code: 'MX', name: 'México' },
];

// Moneda
export const CURRENCY = 'MXN';
export const CURRENCY_SYMBOL = '$';
export const TAX_RATE = 0.16; // IVA 16%

// Breakpoints (deben coincidir con SCSS $bp-*)
export const BREAKPOINTS = {
  SM:  480,
  MD:  768,
  LG:  1024,
  XL:  1280,
  XXL: 1536,
};

// Rutas de la app (identifiers in English — DEC-DOC-005)
export const ROUTES = {
  HOME:      '/',
  CATALOG:   '/catalog',
  CART:      '/cart',
  CHECKOUT:  '/checkout',
  LOGIN:     '/auth/login',
  REGISTER:  '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD:  '/auth/reset-password',
  ACCOUNT:   '/account',
  ORDERS:    '/account/orders',
  WISHLIST:  '/account/wishlist',
  PROFILE:   '/account/profile',
  ADDRESSES: '/account/addresses',
  SUPPORT_TICKETS:        '/support/tickets',
  SUPPORT_TICKET_NEW:     '/support/tickets/new',
  SUPPORT_TICKET_DETAIL:  '/support/tickets/:id',
  RETURNS:                '/account/returns',
  RETURN_NEW:             '/account/returns/new',
  RETURN_DETAIL:          '/account/returns/:id',
  ADMIN_RETURN_DETAIL:    '/admin/returns/:id',
  ADMIN:     '/admin',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_ORDERS:   '/admin/orders',
  ADMIN_USERS:    '/admin/users',
  ADMIN_VOUCHERS: '/admin/vouchers',
  ADMIN_RETURNS:  '/admin/returns',
  ADMIN_SUPPORT:  '/admin/support',
  ADMIN_INVENTORY:'/admin/inventory',
  ADMIN_INVENTORY_IMPORT:    '/admin/inventory/import',
  ADMIN_INVENTORY_MOVEMENTS: '/admin/inventory/:variantId/movements',
  ADMIN_INVENTORY_ADJUST:    '/admin/inventory/:variantId/adjust',
  ADMIN_CONFIG:   '/admin/config',
  ADMIN_REPORTS:  '/admin/reports',
  ADMIN_LOGISTICS:'/admin/logistics',
  ADMIN_PAYMENTS: '/admin/payments',
  ADMIN_CATEGORIES:'/admin/categories',
  ADMIN_VARIANTS: '/admin/variants',
};
