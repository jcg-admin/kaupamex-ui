/**
 * dateRange — PracticaYoruba UI
 *
 * Conversion entre Date y la cadena `YYYY-MM-DD` que los endpoints admin
 * esperan en sus query params (?from=&to=). Modulo sin dependencias para
 * usarse desde filtros que integran DateRangePicker (B2) preservando el
 * contrato que antes producia `<input type="date">`.
 *
 * Reglas: no-lazy imports (no hay imports), canon `codigo_error`.
 */

/**
 * Convierte un Date a la cadena `YYYY-MM-DD` en hora LOCAL.
 *
 * Replica la semantica de `<input type="date">` (fecha civil local, no
 * UTC). Usar `toISOString()` desplazaria el dia segun la zona horaria;
 * aqui se construye con los getters locales para que el formato que la
 * API recibe no cambie.
 *
 * toISODateString(new Date(2026, 4, 5)) → "2026-05-05"
 */
export function toISODateString(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Parsea una cadena `YYYY-MM-DD` a un Date en hora LOCAL (medianoche
 * local), inverso de `toISODateString`. Devuelve null si la cadena es
 * vacia o invalida. Evita `new Date('YYYY-MM-DD')` que se interpreta
 * como UTC y puede retroceder un dia.
 */
export function fromISODateString(str) {
  if (!str) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}
