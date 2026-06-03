/**
 * DataTable — PracticaYoruba UI
 *
 * Tabla reutilizable con ordenamiento, filtro por columna y paginación
 * de cliente. Implementación NATIVA (sin dependencias de licencia).
 *
 * Patrones reimplementados de las siguientes fuentes (lectura, no copia):
 *   - ui-core-5.25.0 scss/_tables.scss — estructura de celda (padding,
 *     border-bottom por fila, thead con vertical-align) → ver DataTable.module.scss.
 *   - kendo-data-query (kno-data-query) dist — pipeline process(): orderBy
 *     (comparador por campo asc/desc) → filterBy (predicado por columna) →
 *     paginación (skip/take). Aquí se reimplementa nativo con Array.sort,
 *     Array.filter y slice.
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
 *   pageSize   — filas por página (paginación de cliente). 0 = sin paginar.
 *   loading    — muestra estado de carga (reusa Alert si existe contenido)
 *   loadingText / emptyText — textos de estado
 *   rowKey     — (row) => key estable (default: row.id ?? índice)
 *   getRowProps — (row) => props extra para <tr>
 *   caption    — accesibilidad
 *   className  — clase extra para el contenedor
 *
 * Reglas: no-lazy imports (todo al top), SCSS Modules, canon `codigo_error`.
 * Iniciativa: datatable-reutilizable-admin
 */
import { useMemo, useState, useCallback, useId } from 'react';
import { Alert } from '../Alert/Alert';
import styles from './DataTable.module.scss';

// Comparador genérico estable — equivale al orderBy de kno-data-query:
// numeros por valor, fechas por timestamp, resto por localeCompare.
function compareValues(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const da = a instanceof Date ? a : null;
  const db = b instanceof Date ? b : null;
  if (da && db) return da.getTime() - db.getTime();
  return String(a).localeCompare(String(b), 'es', { numeric: true, sensitivity: 'base' });
}

// Valor crudo de una columna para ordenar/filtrar (sin pasar por render()).
function rawValue(row, column) {
  if (typeof column.value === 'function') return column.value(row);
  return row?.[column.key];
}

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
  className = '',
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

  // Pipeline process(): filterBy → orderBy. (Paginación se aplica después.)
  const processed = useMemo(() => {
    let out = rows;

    // filterBy — predicado por columna (substring, case-insensitive).
    const activeFilters = Object.entries(filters).filter(([, v]) => v && v.trim() !== '');
    if (activeFilters.length > 0) {
      out = out.filter((row) =>
        activeFilters.every(([key, text]) => {
          const col = columns.find((c) => c.key === key);
          if (!col) return true;
          const v = rawValue(row, col);
          return String(v ?? '').toLowerCase().includes(text.trim().toLowerCase());
        }),
      );
    }

    // orderBy — comparador estable asc/desc.
    if (sort && sort.key) {
      const col = columns.find((c) => c.key === sort.key);
      if (col) {
        const factor = sort.dir === 'desc' ? -1 : 1;
        out = [...out].sort((ra, rb) => factor * compareValues(rawValue(ra, col), rawValue(rb, col)));
      }
    }

    return out;
  }, [rows, columns, filters, sort]);

  // Paginación de cliente — skip/take de data-query traducido a slice.
  const totalRows = processed.length;
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(totalRows / pageSize)) : 1;
  const safePage = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    if (pageSize <= 0) return processed;
    const start = (safePage - 1) * pageSize;
    return processed.slice(start, start + pageSize);
  }, [processed, pageSize, safePage]);

  const colCount = columns.length;

  const ariaSortFor = (column) => {
    if (!column.sortable) return undefined;
    if (!sort || sort.key !== column.key) return 'none';
    return sort.dir === 'asc' ? 'ascending' : 'descending';
  };

  return (
    <div className={`${styles.wrap} ${className}`.trim()}>
      <table className={styles.table}>
        {caption && <caption className={styles.caption}>{caption}</caption>}
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

          {!loading && pageRows.length === 0 && (
            <tr>
              <td colSpan={colCount} className={styles.stateCell}>
                <Alert variant="neutral">{emptyText}</Alert>
              </td>
            </tr>
          )}

          {!loading && pageRows.map((row, index) => {
            const key = rowKey ? rowKey(row) : (row?.id ?? `${baseId}-${index}`);
            const extra = getRowProps ? getRowProps(row) : {};
            return (
              <tr key={key} {...extra}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={column.align === 'right' ? styles.right : undefined}
                  >
                    {column.render ? column.render(row) : (row?.[column.key] ?? '—')}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      {pageSize > 0 && totalRows > pageSize && !loading && (
        <nav className={styles.pagination} aria-label="Paginación de la tabla">
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            aria-label="Página anterior"
          >
            ‹ Anterior
          </button>
          <span className={styles.pageStatus} aria-live="polite">
            Página {safePage} de {totalPages}
          </span>
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            aria-label="Página siguiente"
          >
            Siguiente ›
          </button>
        </nav>
      )}
    </div>
  );
}

export { DataTable };
