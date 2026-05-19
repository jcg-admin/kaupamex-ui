/**
 * AdminReportTopSellersPage — PracticaYoruba
 * UC-REP-02: Reporte de productos mas vendidos (top sellers).
 * UC-REP-05: Exportar a CSV/PDF.
 */
import { useMemo, useState } from 'react';
import {
  useTopSellersReport,
  buildReportExportUrl,
} from '@hooks/domain/useReports';
import styles from './AdminReportPage.module.scss';

const PERIOD_OPTIONS = [
  { value: 'today',   label: 'Hoy' },
  { value: 'week',    label: 'Semana' },
  { value: 'month',   label: 'Mes' },
  { value: 'quarter', label: 'Trimestre' },
  { value: 'year',    label: 'Año' },
];

const LIMIT_OPTIONS = [10, 25, 50, 100];

export default function AdminReportTopSellersPage() {
  const [period, setPeriod] = useState('month');
  const [limit,  setLimit]  = useState(10);

  const params = useMemo(() => ({ period, limit }), [period, limit]);
  const { data, isLoading, error } = useTopSellersReport(params);

  const results        = data?.results ?? [];
  const inactivePct    = data?.inactive_no_sales_pct;

  const csvHref = buildReportExportUrl('top-sellers', { ...params, format: 'csv' });
  const pdfHref = buildReportExportUrl('top-sellers', { ...params, format: 'pdf' });

  return (
    <section className={styles.page} aria-labelledby="report-top-sellers-title">
      <header className={styles.header}>
        <h1 id="report-top-sellers-title" className={styles.title}>
          Top sellers — productos más vendidos
        </h1>
        <div className={styles.exportGroup}>
          <a href={csvHref} className={styles.exportLink}>Exportar CSV</a>
          <a href={pdfHref} className={styles.exportLink}>Exportar PDF</a>
        </div>
      </header>

      <div className={styles.filters}>
        <label className={styles.filter}>
          <span>Periodo</span>
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
        <label className={styles.filter}>
          <span>Top N</span>
          <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
            {LIMIT_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>

      {isLoading && <p>Cargando reporte…</p>}
      {error && (
        <p role="alert" className={styles.error}>
          No se pudo cargar el reporte. Intenta de nuevo.
        </p>
      )}

      {inactivePct != null && (
        <div className={styles.totals} aria-label="Resumen del catalogo">
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Productos activos sin ventas</span>
            <span className={styles.metricValue}>{inactivePct}%</span>
          </div>
        </div>
      )}

      {results.length === 0 ? (
        <p className={styles.empty}>Sin ventas en el periodo.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Producto</th>
              <th>SKU</th>
              <th>Unidades</th>
              <th>Ingreso</th>
              <th>% del total</th>
            </tr>
          </thead>
          <tbody>
            {results.map((row, idx) => (
              <tr key={row.product_id}>
                <td>{idx + 1}</td>
                <td>{row.name}</td>
                <td>{row.sku}</td>
                <td>{row.units}</td>
                <td>{row.revenue}</td>
                <td>{row.share_pct != null ? `${row.share_pct}%` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
