/**
 * chartTheme.js — config compartida de recharts (PracticaYoruba UI)
 *
 * Extrae la configuración que estaba inline en RevenueTrendChart.jsx
 * (colores de serie, defaults de ejes, grid, márgenes) a un único lugar
 * para que todos los gráficos de la UI compartan el mismo look & feel.
 *
 * Colores: los hex `#8b5e3c` (marrón tierra) y `#3c6e8b` (azul) NO existen
 * en la paleta de marca (`src/styles/abstracts/_variables.scss`, que usa
 * lima/vino/bronce/coral/rust). Se conservan aquí los valores que estaban
 * inline en RevenueTrendChart.jsx para no cambiar el render visible; su
 * origen es ese componente, no un token nuevo. Si en el futuro se decide
 * alinear la paleta de gráficos a los tokens de marca, este es el único
 * punto a tocar.
 */

/**
 * Colores de serie para líneas/barras. Origen: valores inline previos de
 * RevenueTrendChart.jsx (`stroke="#8b5e3c"` ingresos, `"#3c6e8b"` órdenes).
 */
export const chartColors = {
  revenue: '#8b5e3c', // marrón tierra — serie de ingresos
  orders: '#3c6e8b',  // azul — serie de órdenes
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

export default { chartColors, axisDefaults, gridDefaults, chartMargin };
