/**
 * DataTable — Kaupamex UI
 *
 * Tabla reutilizable con ordenamiento, filtro por columna y paginación
 * de cliente. Implementación NATIVA (sin dependencias de licencia).
 *
 * Patrones reimplementados de las siguientes fuentes (lectura, no copia):
 *   - ui-core-5.25.0 scss/_tables.scss — estructura de celda (padding,
 *     border-bottom por fila, thead con vertical-align) → ver DataTable.module.scss.
 *   - kendo-data-query (kno-data-query) dist — pipeline process(): orderBy
 *     (comparador por campo asc/desc) → filterBy (predicado por columna) →
 *     paginación (skip/take). Reimplementado nativo y extraído a
 *     `lib/dataQuery.js` (applyFilter / applySort / applyPage); DataTable
 *     solo consume esas funciones puras (Array.sort/filter/slice).
 *   - kno-react-grid dist — modelo de columnas { field, title, sortable } y
 *     toggle de dirección de orden por header clic.
 *   - template-ecommerce-ui/src/components/common — convención de SCSS Modules,
 *     barrel export y atribución por archivo (Chip, Alert, Dropdown).
 *
 * Props:
 *   columns  — [{ key, header, sortable?, render?(row), align? }]
 *   rows     — array de objetos a renderizar
 *   sort     — (controlado) { key, dir: 'asc'|'desc' } | null
 *   onSortChange — (controlado) callback(nextSort)
 *   defaultSort  — (no-controlado) { key, dir } | null
 *   filterable — habilita la fila de filtros por columna (texto)
 *   pageSize   — filas por página. En modo cliente = tamaño del slice (0 = sin
 *                paginar). En modo servidor = "take" (para derivar páginas/info).
 *   loading    — muestra estado de carga (reusa Alert si existe contenido)
 *   loadingText / emptyText — textos de estado
 *   rowKey     — (row) => key estable (default: row.id ?? índice)
 *   getRowProps — (row) => props extra para <tr>
 *   caption    — accesibilidad
 *   captionHidden — renderiza <caption> visualmente oculto (sr-only) — mantiene
 *                la semántica de tabla sin duplicar un <h1> existente.
 *   className  — clase extra para el contenedor
 *
 *   --- Modo servidor (controlado) — adaptado del contrato de kno-react-grid /
 *       kno-react-data-tools Pager (skip/take/total/onPageChange) ---
 *   total      — total de filas en la fuente (todas las páginas). Si se define,
 *                la tabla entra en MODO SERVIDOR: NO corta `rows` (ya son la
 *                página actual) y el paginador se controla desde afuera.
 *   page       — (servidor) página actual 1-based (controlada).
 *   pageCount  — (servidor) total de páginas; si falta se deriva de total/pageSize.
 *   onPageChange — (servidor) callback(nextPage 1-based).
 *   pageSizeOptions — (servidor) [25,50,100] → render de selector "por página".
 *   onPageSizeChange — (servidor) callback(nuevoTamaño).
 *   buttonCount — (servidor) máx. de botones numéricos de página (default 5).
 *
 * Reglas: no-lazy imports (todo al top), SCSS Modules, canon `codigo_error`.
 * Iniciativa: datatable-reutilizable-admin
 */
import { useMemo, useState, useCallback, useId } from 'react';
import { Alert } from '../Alert/Alert';
import Icon from '@components/common/Icon/Icon';
import { applyFilter, applySort, applyPage } from '@lib/dataQuery';
import styles from './DataTable.module.scss';

export default function DataTable({
  columns = [],
  rows = [],
  sort: controlledSort,
  onSortChange,
  defaultSort = null,
  filterable = false,
  pageSize = 0,
  loading = false,
  loadingText = 'Cargando…',
  emptyText = 'Sin resultados',
  rowKey,
  getRowProps,
  caption,
  captionHidden = false,
  className = '',
  // modo servidor (controlado)
  total,
  page: controlledPage,
  pageCount,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
  buttonCount = 5,
}) {
  const baseId = useId();
  const isControlledSort = controlledSort !== undefined;
  const [uncontrolledSort, setUncontrolledSort] = useState(defaultSort);
  const sort = isControlledSort ? controlledSort : uncontrolledSort;

  const [filters, setFilters] = useState({}); // { [key]: texto }
  const [page, setPage] = useState(1);

  // Toggle de orden por header — equivale al click handler del Grid de kno-react-grid:
  // null → asc → desc → null (vuelve a orden natural).
  const handleSort = useCallback((column) => {
    if (!column.sortable) return;
    const next = (() => {
      if (!sort || sort.key !== column.key) return { key: column.key, dir: 'asc' };
      if (sort.dir === 'asc') return { key: column.key, dir: 'desc' };
      return null;
    })();
    if (isControlledSort) onSortChange?.(next);
    else setUncontrolledSort(next);
  }, [sort, isControlledSort, onSortChange]);

  const handleFilter = useCallback((key, text) => {
    setFilters((prev) => ({ ...prev, [key]: text }));
    setPage(1); // filtrar reinicia a la primera página (como skip=0 en data-query)
  }, []);

  // Pipeline process(): filterBy → orderBy (lib/dataQuery, funciones puras).
  // La paginación se aplica después con applyPage para poder calcular el
  // total de filas antes de cortar la página visible.
  const processed = useMemo(
    () => applySort(applyFilter(rows, filters, columns), sort, columns),
    [rows, columns, filters, sort],
  );

  // Modo servidor: `total` definido → `rows` YA son la página actual (no se
  // corta); el paginador se controla desde afuera (skip/take/total del Pager de
  // referencia). Modo cliente: se corta `processed` con applyPage (slice).
  const serverMode = total != null;
  const totalRows = processed.length;
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(totalRows / pageSize)) : 1;
  const safePage = Math.min(page, totalPages);
  const clientPageRows = useMemo(
    () => applyPage(processed, safePage, pageSize),
    [processed, pageSize, safePage],
  );

  // Valores de presentación unificados (cliente vs servidor).
  const displayCount = serverMode ? total : totalRows;
  const displayPages = serverMode
    ? Math.max(1, pageCount ?? (pageSize > 0 ? Math.ceil(total / pageSize) : 1))
    : totalPages;
  const displayPage = serverMode
    ? Math.min(Math.max(1, controlledPage ?? 1), displayPages)
    : safePage;
  const visibleRows = serverMode ? processed : clientPageRows;

  const goTo = useCallback((p) => {
    const clamped = Math.min(Math.max(1, p), displayPages);
    if (serverMode) onPageChange?.(clamped);
    else setPage(clamped);
  }, [serverMode, onPageChange, displayPages]);

  const showPager = serverMode
    ? (displayPages > 1 || (Array.isArray(pageSizeOptions) && pageSizeOptions.length > 0))
    : (pageSize > 0 && totalRows > pageSize && !loading);

  // Ventana de botones numéricos centrada en la página actual (buttonCount).
  const numericPages = useMemo(() => {
    const span = Math.max(1, buttonCount);
    let start = Math.max(1, displayPage - Math.floor(span / 2));
    const end = Math.min(displayPages, start + span - 1);
    start = Math.max(1, end - span + 1);
    const out = [];
    for (let p = start; p <= end; p += 1) out.push(p);
    return out;
  }, [displayPage, displayPages, buttonCount]);

  const colCount = columns.length;

  const ariaSortFor = (column) => {
    if (!column.sortable) return undefined;
    if (!sort || sort.key !== column.key) return 'none';
    return sort.dir === 'asc' ? 'ascending' : 'descending';
  };

  return (
    <div className={`${styles.wrap} ${className}`.trim()}>
      <table className={styles.table}>
        {caption && (
          <caption className={captionHidden ? styles.captionHidden : styles.caption}>
            {caption}
          </caption>
        )}
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                aria-sort={ariaSortFor(column)}
                className={[
                  column.align === 'right' && styles.right,
                  column.sortable && styles.sortable,
                ].filter(Boolean).join(' ')}
              >
                {column.sortable ? (
                  <button
                    type="button"
                    className={styles.sortBtn}
                    onClick={() => handleSort(column)}
                  >
                    <span>{column.header}</span>
                    <span className={styles.sortIcon} aria-hidden="true">
                      {sort && sort.key === column.key
                        ? (sort.dir === 'asc' ? '▲' : '▼')
                        : '↕'}
                    </span>
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>

          {filterable && (
            <tr className={styles.filterRow}>
              {columns.map((column) => (
                <th key={column.key} scope="col">
                  {column.filterable !== false ? (
                    <input
                      type="search"
                      className={styles.filterInput}
                      placeholder={`Filtrar ${typeof column.header === 'string' ? column.header.toLowerCase() : ''}`.trim()}
                      aria-label={`Filtrar por ${typeof column.header === 'string' ? column.header : column.key}`}
                      value={filters[column.key] ?? ''}
                      onChange={(e) => handleFilter(column.key, e.target.value)}
                    />
                  ) : null}
                </th>
              ))}
            </tr>
          )}
        </thead>

        <tbody>
          {loading && (
            <tr>
              <td colSpan={colCount} className={styles.stateCell}>
                <Alert variant="info">{loadingText}</Alert>
              </td>
            </tr>
          )}

          {!loading && visibleRows.length === 0 && (
            <tr>
              <td colSpan={colCount} className={styles.stateCell}>
                <Alert variant="neutral">{emptyText}</Alert>
              </td>
            </tr>
          )}

          {!loading && visibleRows.map((row, index) => {
            const key = rowKey ? rowKey(row) : (row?.id ?? `${baseId}-${index}`);
            const extra = getRowProps ? getRowProps(row) : {};
            return (
              <tr key={key} {...extra}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={column.align === 'right' ? styles.right : undefined}
                    // H-13: etiqueta por celda para el modo tarjeta en móvil
                    // (thead se oculta; cada celda muestra su columna vía ::before).
                    data-label={typeof column.header === 'string' ? column.header : ''}
                  >
                    {column.render ? column.render(row) : (row?.[column.key] ?? '—')}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      {showPager && (
        <nav className={styles.pagination} aria-label="Paginación de la tabla">
          <span className={styles.pageCount} aria-live="polite">
            {displayCount} entradas · Página {displayPage} de {displayPages}
          </span>
          <div className={styles.pager}>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => goTo(displayPage - 1)}
              disabled={displayPage <= 1}
              aria-label="Página anterior"
            >
              <Icon name="chevron-left" size={14} /> Anterior
            </button>
            {numericPages.map((p) => (
              <button
                key={p}
                type="button"
                className={[styles.pageNum, p === displayPage && styles.pageNumActive]
                  .filter(Boolean).join(' ')}
                onClick={() => goTo(p)}
                aria-label={`Página ${p}`}
                aria-current={p === displayPage ? 'page' : undefined}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => goTo(displayPage + 1)}
              disabled={displayPage >= displayPages}
              aria-label="Página siguiente"
            >
              Siguiente <Icon name="chevron-right" size={14} />
            </button>
          </div>
          {serverMode && Array.isArray(pageSizeOptions) && pageSizeOptions.length > 0 && (
            <label className={styles.pageSizeSelect}>
              <span>Por página</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
                aria-label="Filas por página"
              >
                {pageSizeOptions.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          )}
        </nav>
      )}
    </div>
  );
}

export { DataTable };
