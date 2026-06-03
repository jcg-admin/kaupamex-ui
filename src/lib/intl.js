/**
 * intl.js — formateo i18n sin dependencias (PracticaYoruba UI)
 *
 * Reimplementación nativa (lectura, no copia) de los patrones de
 * `@progress/kno-intl`: una superficie data-first y locale-aware de
 * formateo de moneda, número, porcentaje y fecha. El paquete original
 * arrastra un sistema de carga de CLDR + tablas de mensajes por locale;
 * aquí se delega TODO el conocimiento de locale al `Intl` nativo del
 * navegador (Intl.NumberFormat / Intl.DateTimeFormat), que ya implementa
 * CLDR. El módulo solo aporta: defaults del proyecto (es-MX / MXN),
 * memoización de los formatters (que son costosos de construir) y manejo
 * null/NaN seguro.
 *
 * La moneda del proyecto es MXN (PracticaYoruba — productos Yoruba en
 * México). El locale por defecto es es-MX.
 *
 * Contrato de robustez:
 *   - Entradas null/undefined/'' → cadena vacía '' (sentinel documentado).
 *   - Números no parseables (NaN) → cadena vacía ''.
 *   - Fechas no parseables → cadena vacía ''.
 * El sentinel es '' (no '—' ni '0.00') para que el call-site decida cómo
 * presentar la ausencia de dato; así el formatter no impone placeholder.
 *
 * Reglas: no-lazy imports (no hay imports), identifiers en canon inglés.
 */

/** Locale por defecto del proyecto. */
const DEFAULT_LOCALE = 'es-MX';
/** Moneda por defecto del proyecto. */
const DEFAULT_CURRENCY = 'MXN';

/**
 * Cache de instancias Intl.NumberFormat / Intl.DateTimeFormat. Construir
 * un formatter es relativamente caro; al memoizar por (kind, locale,
 * options) se reutiliza la instancia entre llamadas con la misma firma.
 */
const formatterCache = new Map();

/** Clave estable de cache a partir de tipo + locale + options. */
function cacheKey(kind, locale, options) {
  return `${kind}|${locale}|${JSON.stringify(options || {})}`;
}

/** Devuelve (memoizado) un Intl.NumberFormat para la firma dada. */
function getNumberFormat(locale, options) {
  const key = cacheKey('num', locale, options);
  let fmt = formatterCache.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, options);
    formatterCache.set(key, fmt);
  }
  return fmt;
}

/** Devuelve (memoizado) un Intl.DateTimeFormat para la firma dada. */
function getDateTimeFormat(locale, options) {
  const key = cacheKey('dt', locale, options);
  let fmt = formatterCache.get(key);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(locale, options);
    formatterCache.set(key, fmt);
  }
  return fmt;
}

/**
 * Coacciona a número finito. Acepta number o string parseable.
 * @returns {number|null} null si null/undefined/''/NaN/no-finito.
 */
function toFiniteNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

/**
 * Normaliza la entrada a un Date válido. Acepta Date o valor parseable
 * por `new Date()` (ISO string, epoch ms).
 * @returns {Date|null} null si null/undefined o fecha inválida.
 */
function toValidDate(value) {
  if (value === null || value === undefined || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * formatCurrency — formatea un monto como moneda. Default es-MX / MXN.
 *
 * formatCurrency(1234.5)                       → "$1,234.50"
 * formatCurrency(1234.5, { currency: 'USD' })  → "USD 1,234.50" (en es-MX)
 * formatCurrency(null)                         → "" (sentinel)
 *
 * @param {number|string} value monto a formatear.
 * @param {object} [opts]
 * @param {string} [opts.locale='es-MX']
 * @param {string} [opts.currency='MXN']
 * @param {number} [opts.minimumFractionDigits=2]
 * @param {number} [opts.maximumFractionDigits=2]
 * @returns {string} cadena formateada, o '' si value es null/NaN.
 */
export function formatCurrency(value, opts = {}) {
  const num = toFiniteNumber(value);
  if (num === null) return '';
  const {
    locale = DEFAULT_LOCALE,
    currency = DEFAULT_CURRENCY,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    ...rest
  } = opts;
  return getNumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
    ...rest,
  }).format(num);
}

/**
 * formatNumber — formatea un número con separadores de miles y decimales
 * según locale. Sin estilo de moneda ni porcentaje.
 *
 * formatNumber(1234567.89)                          → "1,234,567.89"
 * formatNumber(1234, { minimumFractionDigits: 2 })  → "1,234.00"
 * formatNumber(NaN)                                 → ""
 *
 * @param {number|string} value
 * @param {object} [opts] opciones pasadas a Intl.NumberFormat. `locale`
 *   se extrae; el resto se reenvía (minimumFractionDigits, etc.).
 * @returns {string} '' si value es null/NaN.
 */
export function formatNumber(value, opts = {}) {
  const num = toFiniteNumber(value);
  if (num === null) return '';
  const { locale = DEFAULT_LOCALE, ...rest } = opts;
  return getNumberFormat(locale, rest).format(num);
}

/**
 * formatPercent — formatea una fracción como porcentaje. El input es una
 * FRACCIÓN (0.2 → "20%"), siguiendo la semántica de Intl.NumberFormat con
 * style 'percent'. Pasar 20 daría "2,000%".
 *
 * formatPercent(0.2)                               → "20%"
 * formatPercent(0.1234, { maximumFractionDigits: 1 }) → "12.3%"
 * formatPercent(null)                              → ""
 *
 * @param {number|string} value fracción (0..1 típicamente).
 * @param {object} [opts] `locale` + opciones de Intl.NumberFormat.
 * @returns {string} '' si value es null/NaN.
 */
export function formatPercent(value, opts = {}) {
  const num = toFiniteNumber(value);
  if (num === null) return '';
  const {
    locale = DEFAULT_LOCALE,
    maximumFractionDigits = 0,
    ...rest
  } = opts;
  return getNumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits,
    ...rest,
  }).format(num);
}

/**
 * formatDate — formatea la porción de fecha de un valor. Default es-MX con
 * estilo de fecha "long" (ej. "5 de mayo de 2026"). Acepta Date o valor
 * parseable. Null-safe.
 *
 * formatDate('2026-05-05')                       → "5 de mayo de 2026"
 * formatDate(d, { day: '2-digit', month: '2-digit', year: 'numeric' })
 * formatDate(null)                               → ""
 *
 * Si no se pasa ninguna opción de componente, usa dateStyle. Si se pasan
 * componentes explícitos (day/month/year/weekday), se usan tal cual.
 *
 * @param {Date|string|number} value
 * @param {object} [opts] `locale` + opciones de Intl.DateTimeFormat.
 * @returns {string} '' si value es null o inválido.
 */
export function formatDate(value, opts = {}) {
  const d = toValidDate(value);
  if (!d) return '';
  const { locale = DEFAULT_LOCALE, ...rest } = opts;
  const options = Object.keys(rest).length === 0
    ? { day: 'numeric', month: 'long', year: 'numeric' }
    : rest;
  return getDateTimeFormat(locale, options).format(d);
}

/**
 * formatDateTime — formatea fecha + hora de un valor. Default es-MX con
 * componentes de fecha corta + hora:minuto. Acepta Date o valor parseable.
 * Null-safe.
 *
 * formatDateTime('2026-05-05T14:30:00')          → "05/05/2026, 14:30" (aprox)
 * formatDateTime(null)                           → ""
 *
 * @param {Date|string|number} value
 * @param {object} [opts] `locale` + opciones de Intl.DateTimeFormat.
 * @returns {string} '' si value es null o inválido.
 */
export function formatDateTime(value, opts = {}) {
  const d = toValidDate(value);
  if (!d) return '';
  const { locale = DEFAULT_LOCALE, ...rest } = opts;
  const options = Object.keys(rest).length === 0
    ? {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
    : rest;
  return getDateTimeFormat(locale, options).format(d);
}

export default {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatDate,
  formatDateTime,
};
