/**
 * Constantes globales — Kaupamex
 */

// API endpoints base — resolved from the build-time env var; no hardcoded host
// so the same bundle works in development, staging, and production.
// apiService.js uses process.env.API_URL directly; this constant is kept for
// any non-apiService callers that import it.
export const API_BASE = process.env.API_URL || '';

// Paginación por defecto
export const DEFAULT_PAGE_SIZE = 20;

// Estados de orden — vocabulario canónico del contrato ?status= (O2C
// rebanada 6). Deriva de los ejes O2C (sale.state + pago + guía). Los 3
// valores muertos del enum legacy (PROCESSING, IN_PREPARATION, REFUNDED)
// quedaron fuera: la proyección canónica nunca los emite. DRAFT es un estado
// de la SaleOrder (carrito), no de una orden materializada — el API lo acepta
// por completitud pero no aplica a esta lista.
export const ORDER_STATUS = {
  DRAFT:     'DRAFT',
  PENDING:   'PENDING',
  PAID:      'PAID',
  SHIPPED:   'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

export const ORDER_STATUS_LABELS = {
  DRAFT:     'Borrador',
  PENDING:   'Pendiente',
  PAID:      'Pagado',
  SHIPPED:   'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
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
