/**
 * dateMath.js — utilidades de fecha sin dependencias (Kaupamex UI)
 *
 * Reimplementación nativa (lectura, no copia) de los patrones de
 * `@progress/kno-date-math` (kno-date-math dist/es): addDays / addMonths
 * (clonar + setDate/setMonth con normalización de fin de mes), getDate
 * (medianoche local = startOfDay) e isEqualDate (comparación de la porción
 * de fecha = isSameDay). El paquete original arrastra manejo de DST y zonas
 * horarias IANA; aquí se trabaja en hora LOCAL civil (suficiente para
 * Calendar/DateRangePicker, B2, que operan en la fecha local del usuario) y
 * se omite la maquinaria de DST/tz por innecesaria.
 *
 * Todas las funciones son puras y NO mutan su entrada (clonan antes de
 * mutar). Aceptan Date o un valor parseable por `new Date()`.
 *
 * Reglas: no-lazy imports (no hay imports), canon `codigo_error`.
 */

/** Normaliza la entrada a un Date (clon si ya es Date). null si inválida. */
function toDate(value) {
  if (value == null) return null;
  const d = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * addDays — suma (o resta con offset negativo) días a una fecha.
 * Patrón kno-date-math add-days: clonar + setDate(getDate + offset).
 *
 * addDays(new Date(2026, 0, 1), 5) → 2026-01-06
 * addDays(new Date(2026, 0, 1), -5) → 2025-12-27
 *
 * @returns {Date|null} nueva instancia (no muta la entrada)
 */
export function addDays(date, offset) {
  const d = toDate(date);
  if (!d) return null;
  d.setDate(d.getDate() + offset);
  return d;
}

/**
 * addMonths — suma/resta meses normalizando el fin de mes. Patrón
 * kno-date-math add-months: si el día desborda (ej. 31 ene + 1 mes), se
 * ajusta al último día del mes destino en lugar de saltar al mes siguiente.
 *
 * addMonths(new Date(2026, 0, 31), 1) → 2026-02-28 (no 2026-03-03)
 *
 * @returns {Date|null}
 */
export function addMonths(date, offset) {
  const d = toDate(date);
  if (!d) return null;
  const day = d.getDate();
  d.setDate(1); // evitar el rollover de día antes de cambiar el mes
  d.setMonth(d.getMonth() + offset);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
}

/**
 * startOfDay — medianoche local de la fecha (patrón kno-date-math getDate).
 *
 * @returns {Date|null}
 */
export function startOfDay(date) {
  const d = toDate(date);
  if (!d) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * endOfDay — último milisegundo del día en hora local (23:59:59.999).
 *
 * @returns {Date|null}
 */
export function endOfDay(date) {
  const d = toDate(date);
  if (!d) return null;
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * isSameDay — compara la porción de fecha (año/mes/día) en hora local.
 * Patrón kno-date-math isEqualDate. Dos null se consideran iguales.
 *
 * @returns {boolean}
 */
export function isSameDay(a, b) {
  const da = toDate(a);
  const db = toDate(b);
  if (!da && !db) return true;
  if (!da || !db) return false;
  return da.getFullYear() === db.getFullYear()
    && da.getMonth() === db.getMonth()
    && da.getDate() === db.getDate();
}

/**
 * diffDays — número entero de días civiles entre dos fechas (b - a),
 * comparando startOfDay para que la hora no afecte el conteo. Positivo si
 * `b` es posterior a `a`.
 *
 * diffDays(2026-01-01, 2026-01-03) → 2
 *
 * @returns {number|null} null si alguna fecha es inválida
 */
export function diffDays(a, b) {
  const da = startOfDay(a);
  const db = startOfDay(b);
  if (!da || !db) return null;
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((db.getTime() - da.getTime()) / MS_PER_DAY);
}

/**
 * clampDate — restringe `date` al rango [min, max]. Cualquiera de los
 * límites puede ser null/omitido (rango abierto por ese lado).
 *
 * @returns {Date|null} nueva instancia dentro del rango, o null si `date` inválida
 */
export function clampDate(date, min, max) {
  const d = toDate(date);
  if (!d) return null;
  const lo = toDate(min);
  const hi = toDate(max);
  if (lo && d.getTime() < lo.getTime()) return lo;
  if (hi && d.getTime() > hi.getTime()) return hi;
  return d;
}

export default { addDays, addMonths, startOfDay, endOfDay, isSameDay, diffDays, clampDate };
