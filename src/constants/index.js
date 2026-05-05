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

// Rutas de la app
export const ROUTES = {
  HOME:      '/',
  CATALOG:   '/catalogo',
  CART:      '/carrito',
  CHECKOUT:  '/checkout',
  LOGIN:     '/auth/login',
  REGISTER:  '/auth/registro',
  ACCOUNT:   '/mi-cuenta',
  ORDERS:    '/mi-cuenta/pedidos',
  WISHLIST:  '/mi-cuenta/favoritos',
  PROFILE:   '/mi-cuenta/perfil',
  ADMIN:     '/admin',
};
