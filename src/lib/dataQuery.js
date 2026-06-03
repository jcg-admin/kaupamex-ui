/**
 * dataQuery.js — pipeline de datos puro (PracticaYoruba UI)
 *
 * Extrae el pipeline que estaba inline en DataTable.jsx (sort + filter +
 * paginación de cliente) a funciones puras reutilizables. Patrón
 * reimplementado (lectura, no copia) del `process()` de kendo-data-query
 * (kno-data-query dist): orderBy (comparador por campo asc/desc) → filterBy
 * (predicado por columna) → skip/take (paginación). Aquí se reimplementa
 * nativo con Array.sort / Array.filter / slice, sin dependencias.
 *
 * Las funciones son puras: no mutan `rows` (orderBy clona antes de ordenar)
 * y son seguras de memoizar.
 *
 * Reglas: no-lazy imports (no hay imports), SCSS Modules N/A, canon
 * `codigo_error`.
 */

/**
 * Comparador genérico estable — equivale al orderBy de kno-data-query:
 * números por valor, fechas por timestamp, resto por localeCompare ('es',
 * numeric). null/undefined se ordenan primero (ascendente).
 */
export function compareValues(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const da = a instanceof Date ? a : null;
  const db = b instanceof Date ? b : null;
  if (da && db) return da.getTime() - db.getTime();
  return String(a).localeCompare(String(b), 'es', { numeric: true, sensitivity: 'base' });
}

/**
 * Valor crudo de una columna para ordenar/filtrar, sin pasar por render().
 * Si la columna define `value(row)`, se usa esa función; si no, `row[key]`.
 */
export function rawValue(row, column) {
  if (column && typeof column.value === 'function') return column.value(row);
  return row?.[column?.key];
}

/**
 * applyFilter — filterBy de data-query. Aplica predicados de substring
 * (case-insensitive) por columna. `filters` es { [key]: texto }; solo los
 * textos no vacíos cuentan, y se combinan con AND.
 *
 * @param {object[]} rows
 * @param {object}   filters  — { [columnKey]: texto }
 * @param {object[]} columns  — modelo de columnas { key, value? }
 * @returns {object[]} subconjunto de rows (no muta el array original)
 */
export function applyFilter(rows, filters, columns) {
  const activeFilters = Object.entries(filters || {}).filter(([, v]) => v && v.trim() !== '');
  if (activeFilters.length === 0) return rows;
  return rows.filter((row) =>
    activeFilters.every(([key, text]) => {
      const col = (columns || []).find((c) => c.key === key);
      if (!col) return true;
      const v = rawValue(row, col);
      return String(v ?? '').toLowerCase().includes(text.trim().toLowerCase());
    }),
  );
}

/**
 * applySort — orderBy de data-query. Ordena por una columna con dirección
 * asc/desc usando `compareValues`. Devuelve un array NUEVO (no muta `rows`).
 * Si `sort` es null/sin key o la columna no existe, devuelve `rows` tal cual.
 *
 * @param {object[]} rows
 * @param {{key:string, dir:'asc'|'desc'}|null} sort
 * @param {object[]} columns
 * @returns {object[]}
 */
export function applySort(rows, sort, columns) {
  if (!sort || !sort.key) return rows;
  const col = (columns || []).find((c) => c.key === sort.key);
  if (!col) return rows;
  const factor = sort.dir === 'desc' ? -1 : 1;
  return [...rows].sort((ra, rb) => factor * compareValues(rawValue(ra, col), rawValue(rb, col)));
}

/**
 * applyPage — skip/take de data-query traducido a slice. `pageSize <= 0`
 * significa "sin paginar" y devuelve `rows` tal cual.
 *
 * @param {object[]} rows
 * @param {number} page     — 1-based
 * @param {number} pageSize — filas por página (0 = sin paginar)
 * @returns {object[]}
 */
export function applyPage(rows, page, pageSize) {
  if (!pageSize || pageSize <= 0) return rows;
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

/**
 * process — pipeline completo equivalente a kendo-data-query `process()`:
 * filterBy → orderBy → skip/take. Devuelve los datos paginados y el total
 * (filas tras filtrar/ordenar, antes de paginar) para construir la UI de
 * paginación.
 *
 * @param {object[]} rows
 * @param {object}   options
 * @param {object}   options.filters  — { [key]: texto }
 * @param {object}   options.sort     — { key, dir } | null
 * @param {number}   options.page     — 1-based (default 1)
 * @param {number}   options.pageSize — 0 = sin paginar
 * @param {object[]} options.columns  — modelo de columnas
 * @returns {{ data: object[], total: number }}
 */
export function process(rows = [], options = {}) {
  const { filters = {}, sort = null, page = 1, pageSize = 0, columns = [] } = options;
  const filtered = applyFilter(rows, filters, columns);
  const sorted = applySort(filtered, sort, columns);
  return {
    data: applyPage(sorted, page, pageSize),
    total: sorted.length,
  };
}

export default { process, applyFilter, applySort, applyPage, compareValues, rawValue };
