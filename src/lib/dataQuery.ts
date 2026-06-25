export interface SortState {
  key: string;
  dir: 'asc' | 'desc';
}

export interface FilterState {
  [columnKey: string]: string;
}

export interface PageState {
  page: number;
  pageSize: number;
}

export interface Column {
  key: string;
  value?: (row: Record<string, unknown>) => unknown;
}

export interface ProcessOptions {
  filters?: FilterState;
  sort?: SortState | null;
  page?: number;
  pageSize?: number;
  columns?: Column[];
}

export interface ProcessResult<T = Record<string, unknown>> {
  data: T[];
  total: number;
}

export function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const da = a instanceof Date ? a : null;
  const db = b instanceof Date ? b : null;
  if (da && db) return da.getTime() - db.getTime();
  return String(a).localeCompare(String(b), 'es', { numeric: true, sensitivity: 'base' });
}

export function rawValue(row: Record<string, unknown>, column: Column): unknown {
  if (column && typeof column.value === 'function') return column.value(row);
  return row?.[column?.key];
}

export function applyFilter<T extends Record<string, unknown>>(
  rows: T[],
  filters: FilterState,
  columns: Column[],
): T[] {
  const activeFilters = Object.entries(filters || {}).filter(([, v]) => v && v.trim() !== '');
  if (activeFilters.length === 0) return rows;
  return rows.filter((row) =>
    activeFilters.every(([key, text]) => {
      const col = (columns || []).find((c) => c.key === key);
      if (!col) return true;
      const v = rawValue(row as Record<string, unknown>, col);
      return String(v ?? '').toLowerCase().includes(text.trim().toLowerCase());
    }),
  );
}

export function applySort<T extends Record<string, unknown>>(
  rows: T[],
  sort: SortState | null | undefined,
  columns: Column[],
): T[] {
  if (!sort || !sort.key) return rows;
  const col = (columns || []).find((c) => c.key === sort.key);
  if (!col) return rows;
  const factor = sort.dir === 'desc' ? -1 : 1;
  return [...rows].sort(
    (ra, rb) => factor * compareValues(rawValue(ra as Record<string, unknown>, col), rawValue(rb as Record<string, unknown>, col)),
  );
}

export function applyPage<T>(rows: T[], page: number, pageSize: number): T[] {
  if (!pageSize || pageSize <= 0) return rows;
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function process<T extends Record<string, unknown>>(
  rows: T[] = [],
  options: ProcessOptions = {},
): ProcessResult<T> {
  const { filters = {}, sort = null, page = 1, pageSize = 0, columns = [] } = options;
  const filtered = applyFilter(rows, filters, columns as Column[]);
  const sorted = applySort(filtered, sort, columns as Column[]);
  return {
    data: applyPage(sorted, page, pageSize),
    total: sorted.length,
  };
}

export default { process, applyFilter, applySort, applyPage, compareValues, rawValue };
