/**
 * promotionsTimeline.js — lógica pura del timeline de promociones (UC-ADM-02).
 *
 * Reemplaza el "Gantt" de kno (kno-react-gantt, Kendo) por una visualización
 * nativa: se calcula, para cada promoción con rango de fechas
 * (valid_from/valid_until), su posición horizontal (left%/width%) sobre un eje
 * temporal común. Sin dependencias; el render es CSS/SVG.
 *
 * Separado del componente para poder testear el cálculo de forma determinista
 * (fechas fijas, sin new Date()).
 *
 * @typedef {{ id:(string|number), label:string, type?:string,
 *   valid_from?:string|null, valid_until?:string|null }} Promo
 */

const DAY = 86400000;

/** Parsea una fecha ISO a timestamp ms; null/inválida → null. */
export function parseDate(value) {
  if (!value) return null;
  const t = Date.parse(value);
  return Number.isNaN(t) ? null : t;
}

/**
 * Rango [start, end] (ms) que cubre todas las promos, con un margen de padDays.
 * valid_from ausente cuenta como "ya vigente"; valid_until ausente como
 * "sin fin" — para el eje se acotan al min/max observado.
 * @param {Promo[]} promos
 * @param {{ padDays?:number, fallbackSpanDays?:number, now:number }} opts
 * @returns {{ start:number, end:number }}
 */
export function computeRange(promos, { padDays = 3, fallbackSpanDays = 30, now }) {
  const froms = promos.map((p) => parseDate(p.valid_from)).filter((t) => t != null);
  const untils = promos.map((p) => parseDate(p.valid_until)).filter((t) => t != null);
  let start = froms.length ? Math.min(...froms) : now;
  let end = untils.length ? Math.max(...untils) : now + fallbackSpanDays * DAY;
  if (end <= start) end = start + fallbackSpanDays * DAY;
  start -= padDays * DAY;
  end += padDays * DAY;
  return { start, end };
}

/** Clampa n al rango [lo, hi]. */
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

/**
 * Calcula las barras (left%/width%) de cada promo sobre el rango dado.
 * Promos totalmente fuera del rango se marcan visible=false.
 * @param {Promo[]} promos
 * @param {{ start:number, end:number, now:number }} range
 * @returns {Array<Promo & { leftPct:number, widthPct:number, visible:boolean,
 *   active:boolean }>}
 */
export function computeBars(promos, { start, end, now }) {
  const span = end - start || 1;
  return promos.map((p) => {
    const rawF = parseDate(p.valid_from);
    const rawU = parseDate(p.valid_until);
    // Una promo sin NINGUNA fecha no tiene rango que ubicar en el eje: no se
    // dibuja (evita barras que abarcan todo el eje sin significado).
    const hasRange = rawF != null || rawU != null;
    const f = rawF ?? start;
    const u = rawU ?? end;
    const cf = clamp(f, start, end);
    const cu = clamp(u, start, end);
    const visible = hasRange && cu > cf;
    const leftPct = ((cf - start) / span) * 100;
    const widthPct = Math.max(((cu - cf) / span) * 100, visible ? 0.5 : 0);
    const active = f <= now && now <= u;
    return { ...p, leftPct, widthPct, visible, active };
  });
}

/** Posición % del marcador "hoy" en el eje (o null si queda fuera). */
export function nowMarkerPct({ start, end, now }) {
  if (now < start || now > end) return null;
  return ((now - start) / (end - start || 1)) * 100;
}

/** Ticks de fecha (ms) uniformes para el eje; count divisiones. */
export function axisTicks({ start, end }, count = 6) {
  const step = (end - start) / count;
  return Array.from({ length: count + 1 }, (_, i) => Math.round(start + i * step));
}
