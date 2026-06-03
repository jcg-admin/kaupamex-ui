/**
 * chartTheme.js — config compartida de recharts (PracticaYoruba UI)
 *
 * Extrae la configuración que estaba inline en RevenueTrendChart.jsx
 * (colores de serie, defaults de ejes, grid, márgenes) a un único lugar
 * para que todos los gráficos de la UI compartan el mismo look & feel.
 *
 * Colores: la paleta de serie deriva de los tokens de marca Yoruba
 * ("Natural vivo") definidos en `src/styles/abstracts/_tokens.scss`, que
 * expone los hex como CSS custom properties en `:root`:
 *
 *   --c-lime:   #8CB800  (verde lima · dominante)   ← _tokens.scss:13
 *   --c-vino:   #7A1E1E  (rojo vino · complementario) ← _tokens.scss:19
 *   --c-bronze: #B89840  (dorado bronce · árbitro)   ← _tokens.scss:21
 *   --c-coral:  #D86030  (naranja coral · puente)    ← _tokens.scss:23
 *   --c-rust:   #A07820  (dorado oxidado · cierre)   ← _tokens.scss:25
 *
 * Los mismos valores viven como variables SCSS en
 * `src/styles/abstracts/_variables.scss` (`$lime` :17, `$vino` :25,
 * `$bronze` :30, `$coral` :35, `$rust` :39).
 *
 * Los hex previos `#8b5e3c` (marrón tierra) y `#3c6e8b` (azul) eran
 * heredados del prototipo y NO pertenecen a la marca — fueron eliminados.
 *
 * Estrategia de resolución: cuando hay `:root` con las CSS vars (browser),
 * se leen vía `getComputedStyle` para seguir el tema en runtime; en jsdom
 * o si la var no está definida, se cae al fallback estático que replica
 * los tokens. Módulo puro (sin lazy imports).
 */

/**
 * Fallback estático de los tokens de marca, espejo de los CSS custom
 * properties de `_tokens.scss`. Se usa en SSR/jsdom o cuando la CSS var
 * no está disponible. Cada entrada cita su origen `file:line`.
 */
export const BRAND_TOKENS = {
  lime:   '#8CB800', // _tokens.scss:13 / _variables.scss:17 — dominante
  vino:   '#7A1E1E', // _tokens.scss:19 / _variables.scss:25 — complementario
  bronze: '#B89840', // _tokens.scss:21 / _variables.scss:30 — árbitro
  coral:  '#D86030', // _tokens.scss:23 / _variables.scss:35 — puente
  rust:   '#A07820', // _tokens.scss:25 / _variables.scss:39 — cierre
};

/**
 * Resuelve un token de marca a su hex. Prefiere la CSS custom property
 * `--c-<token>` leída de `:root` (sigue el tema en runtime); si no está
 * definida o no hay DOM, devuelve el fallback estático de BRAND_TOKENS.
 *
 * @param {keyof typeof BRAND_TOKENS} token
 * @returns {string} hex (`#RRGGBB`)
 */
export function brandColor(token) {
  const fallback = BRAND_TOKENS[token];
  if (
    typeof window !== 'undefined' &&
    typeof window.getComputedStyle === 'function' &&
    typeof document !== 'undefined' &&
    document.documentElement
  ) {
    const value = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue(`--c-${token}`)
      .trim();
    if (value) return value;
  }
  return fallback;
}

/**
 * Paleta de serie ordenada para gráficos multi-serie. Deriva de los
 * tokens de marca; el orden prioriza hues distintos y con contraste
 * suficiente entre series adyacentes (lima → vino → bronce → coral →
 * rust).
 *
 * @returns {string[]} hexes de serie en orden
 */
export function getSeriesPalette() {
  return [
    brandColor('lime'),
    brandColor('vino'),
    brandColor('bronze'),
    brandColor('coral'),
    brandColor('rust'),
  ];
}

/**
 * Paleta de serie estática (snapshot del fallback) para consumidores que
 * solo necesitan un array constante sin resolver CSS vars.
 */
export const seriesPalette = [
  BRAND_TOKENS.lime,
  BRAND_TOKENS.vino,
  BRAND_TOKENS.bronze,
  BRAND_TOKENS.coral,
  BRAND_TOKENS.rust,
];

/**
 * Colores de serie nombrados para RevenueTrendChart (ingresos / órdenes).
 * Ingresos = lima (dominante de marca); órdenes = vino (complementario),
 * el par de mayor contraste de la paleta.
 */
export const chartColors = {
  revenue: BRAND_TOKENS.lime, // verde lima — serie de ingresos
  orders:  BRAND_TOKENS.vino, // rojo vino — serie de órdenes
};

/**
 * Defaults de ejes (X / Y). Tamaño de tick consistente con el inline previo.
 */
export const axisDefaults = {
  tick: { fontSize: 12 },
};

/**
 * Defaults del grid cartesiano.
 */
export const gridDefaults = {
  strokeDasharray: '3 3',
};

/**
 * Márgenes por defecto del área de dibujo.
 */
export const chartMargin = {
  top: 8,
  right: 16,
  left: 0,
  bottom: 0,
};

export default {
  BRAND_TOKENS,
  brandColor,
  getSeriesPalette,
  seriesPalette,
  chartColors,
  axisDefaults,
  gridDefaults,
  chartMargin,
};
