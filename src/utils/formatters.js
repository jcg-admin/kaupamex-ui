/**
 * Formatters — PracticaYoruba
 * Funciones utilitarias de formateo para el e-commerce
 */

import { CURRENCY, CURRENCY_SYMBOL } from '@constants';

/**
 * Formatea un precio en pesos mexicanos.
 * formatPrice(1234.5) → "$1,234.50"
 */
export function formatPrice(amount, symbol = CURRENCY_SYMBOL) {
  if (amount === null || amount === undefined) return `${symbol}0.00`;
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${symbol}${num.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Calcula el porcentaje de descuento.
 * discountPercent(100, 80) → 20
 */
export function discountPercent(original, final) {
  if (!original || original === final) return 0;
  return Math.round(((original - final) / original) * 100);
}

/**
 * Formatea una fecha en español.
 * formatDate('2026-05-05') → "5 de mayo de 2026"
 */
export function formatDate(dateStr, options = {}) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  });
}

/**
 * Formatea fecha relativa.
 * formatRelativeDate('2026-05-01') → "hace 4 días"
 */
export function formatRelativeDate(dateStr) {
  if (!dateStr) return '';
  const date  = new Date(dateStr);
  const now   = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'hoy';
  if (diffDays === 1) return 'ayer';
  if (diffDays < 7)  return `hace ${diffDays} días`;
  if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} semanas`;
  return formatDate(dateStr);
}

/**
 * Trunca un string largo.
 */
export function truncate(str, length = 80) {
  if (!str) return '';
  if (str.length <= length) return str;
  return `${str.slice(0, length).trim()}…`;
}

/**
 * Genera el SKU display desde variantId y productCode.
 */
export function formatSku(productCode, variantSuffix) {
  if (!productCode) return '';
  if (!variantSuffix) return productCode;
  return `${productCode}-${variantSuffix}`;
}

/**
 * Formatea el número de orden.
 * formatOrderNumber(123) → "#000123"
 */
export function formatOrderNumber(id) {
  if (!id) return '';
  return `#${String(id).padStart(6, '0')}`;
}
