/**
 * AdminReportCustomersRfmPage — PracticaYoruba
 * UC-REP-04: Reporte de clientes con segmentacion RFM.
 * UC-REP-05: Exportar a CSV/PDF.
 */
import { useMemo, useState } from 'react';
import {
  useCustomersRfmReport,
  buildReportExportUrl,
} from '@hooks/domain/useReports';
import styles from './AdminReportPage.module.scss';

const PERIOD_OPTIONS = [
  { value: 'month',   label: 'Mes' },
  { value: 'quarter', label: 'Trimestre' },
  { value: 'year',    label: 'Año' },
];

const SEGMENT_OPTIONS = [
  { value: '',         label: 'Todos los segmentos' },
  { value: 'NEW',      label: 'Nuevos' },
  { value: 'REGULAR',  label: 'Regulares' },
  { value: 'VIP',      label: 'VIP' },
  { value: 'AT_RISK',  label: 'En riesgo' },
  { value: 'INACTIVE', label: 'Inactivos' },
];

const SEGMENT_LABEL = {
  NEW:      'Nuevo',
  REGULAR:  'Regular',
  VIP:      'VIP',
  AT_RISK:  'En riesgo',
  INACTIVE: 'Inactivo',
};

export default function AdminReportCustomersRfmPage() {
  const [period,  setPeriod]  = useState('quarter');
  const [segment, setSegment] = useState('');

  const params = useMemo(() => {
    const p = { period };
    if (segment) p.segment = segment;
    return p;
  }, [period, segment]);

  const { data, isLoading, error } = useCustomersRfmReport(params);

  const results = data?.results ?? [];
  const totals  = data?.totals  ?? {};

  const csvHref = buildReportExportUrl('customers-rfm', { ...params, format: 'csv' });
  const pdfHref = buildReportExportUrl('customers-rfm', { ...params, format: 'pdf' });

  return (
    <section className={styles.page} aria-labelledby="report-rfm-title">
      <header className={styles.header}>
        <h1 id="report-rfm-title" className={styles.title}>
          Clientes (RFM)
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
          <span>Segmento</span>
          <select value={segment} onChange={(e) => setSegment(e.target.value)}>
            {SEGMENT_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
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

      <div className={styles.totals} aria-label="Totales de clientes">
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Nuevos</span>
          <span className={styles.metricValue}>{totals.new_count ?? 0}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Recurrentes</span>
          <span className={styles.metricValue}>{totals.returning_count ?? 0}</span>
        </div>
      </div>

      {results.length === 0 ? (
        <p className={styles.empty}>Sin clientes en el periodo.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Email</th>
              <th>Segmento</th>
              <th>Recencia (días)</th>
              <th>Frecuencia</th>
              <th>Monetario</th>
            </tr>
          </thead>
          <tbody>
            {results.map((row) => (
              <tr key={row.customer_id}>
                <td>{row.name ?? '—'}</td>
                <td>{row.email ?? '—'}</td>
                <td>{SEGMENT_LABEL[row.segment] ?? row.segment}</td>
                <td>{row.recency}</td>
                <td>{row.frequency}</td>
                <td>{row.monetary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
