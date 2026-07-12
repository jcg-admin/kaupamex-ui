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
import { DataTable } from '@components/common/DataTable/DataTable';
import SplitButton from '@components/common/SplitButton/SplitButton';
import styles from './AdminReportPage.module.scss';

const PERIOD_OPTIONS = [
  { value: 'month',   label: 'Mes' },
  { value: 'quarter', label: 'Trimestre' },
  { value: 'year',    label: 'Año' },
];

// D-16: values match backend RFM labels (DEC-DOC-005 — English identifiers).
const SEGMENT_OPTIONS = [
  { value: '',           label: 'Todos los segmentos' },
  { value: 'CHAMPIONS',  label: 'Campeones' },
  { value: 'LOYAL',      label: 'Leales' },
  { value: 'RECENT',     label: 'Recientes' },
  { value: 'AT_RISK',    label: 'En riesgo' },
  { value: 'OCCASIONAL', label: 'Ocasionales' },
];

const SEGMENT_LABEL = {
  CHAMPIONS:  'Campeón',
  LOYAL:      'Leal',
  RECENT:     'Reciente',
  AT_RISK:    'En riesgo',
  OCCASIONAL: 'Ocasional',
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

  const columns = useMemo(() => [
    { key: 'user_id', header: 'ID Usuario', sortable: true, align: 'right' },
    { key: 'email', header: 'Email', sortable: true, render: (row) => row.email ?? '—' },
    {
      key: 'segment',
      header: 'Segmento',
      sortable: true,
      value: (row) => SEGMENT_LABEL[row.segment] ?? row.segment,
      render: (row) => SEGMENT_LABEL[row.segment] ?? row.segment,
    },
    { key: 'recency_days', header: 'Recencia (días)', sortable: true, align: 'right' },
    { key: 'frequency', header: 'Frecuencia', sortable: true, align: 'right' },
    { key: 'monetary', header: 'Monetario', sortable: true, align: 'right' },
  ], []);

  return (
    <section className={styles.page} aria-labelledby="report-rfm-title">
      <header className={styles.header}>
        <h1 id="report-rfm-title" className={styles.title}>
          Clientes (RFM)
        </h1>
        <div className={styles.exportGroup}>
          <SplitButton
            text="Exportar CSV"
            href={csvHref}
            ariaLabel="Más formatos de exportación"
            items={[{ text: 'Exportar PDF', href: pdfHref }]}
          />
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
          <span className={styles.metricLabel}>Clientes</span>
          <span className={styles.metricValue}>{totals.customer_count ?? 0}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Monetario total</span>
          <span className={styles.metricValue}>{totals.total_monetary ?? '0.00'}</span>
        </div>
      </div>

      {results.length === 0 ? (
        <p className={styles.empty}>Sin clientes en el periodo.</p>
      ) : (
        <DataTable
          columns={columns}
          rows={results}
          rowKey={(row) => row.user_id}
          caption="Clientes segmentados por RFM"
        />
      )}
    </section>
  );
}
