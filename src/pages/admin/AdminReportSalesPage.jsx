/**
 * AdminReportSalesPage — PracticaYoruba
 * UC-REP-01: Reporte ejecutivo de ingresos y ventas.
 * UC-REP-05: Exportar el reporte a CSV o PDF (boton de descarga).
 */
import { useMemo, useState } from 'react';
import {
  useSalesReport,
  buildReportExportUrl,
} from '@hooks/domain/useReports';
import RevenueTrendChart from '@components/charts/RevenueTrendChart';
import { DataTable } from '@components/common/DataTable/DataTable';
import { DateRangePicker } from '@components/common/DatePicker/DateRangePicker';
import SplitButton from '@components/common/SplitButton/SplitButton';
import { toISODateString, fromISODateString } from '@utils/dateRange';
import { exportToCsv } from '@lib/csvExporter';
import styles from './AdminReportPage.module.scss';

const SERIES_CSV_COLUMNS = [
  { key: 'date',    header: 'Fecha' },
  { key: 'revenue', header: 'Ingreso' },
  { key: 'orders',  header: 'Ordenes' },
];

const PERIOD_OPTIONS = [
  { value: 'today',   label: 'Hoy' },
  { value: 'week',    label: 'Semana' },
  { value: 'month',   label: 'Mes' },
  { value: 'quarter', label: 'Trimestre' },
  { value: 'year',    label: 'Año' },
];

const DEFAULT_PERIOD = 'month';

export default function AdminReportSalesPage() {
  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const [from, setFrom]     = useState('');
  const [to, setTo]         = useState('');
  const params = useMemo(() => {
    const p = { period };
    if (from) p.date_from = from;
    if (to)   p.date_to   = to;
    return p;
  }, [period, from, to]);
  const { data, isLoading, error } = useSalesReport(params);

  const totals     = data?.totals     ?? {};
  const comparison = data?.comparison ?? {};
  const series     = data?.series     ?? [];
  const breakdown  = data?.payment_breakdown ?? [];

  const csvHref = buildReportExportUrl('sales', { ...params, format: 'csv' });
  const pdfHref = buildReportExportUrl('sales', { ...params, format: 'pdf' });

  // H-CICLO27-02: alinear claves con la respuesta real de la API.
  // La API devuelve comparison.revenue_delta_pct, no gross_revenue_delta_pct.
  const delta = comparison?.revenue_delta_pct;
  const deltaClass =
    delta == null ? '' :
    delta >= 0   ? styles.metricDeltaUp : styles.metricDeltaDown;

  const seriesColumns = useMemo(() => [
    { key: 'date', header: 'Fecha', sortable: true },
    { key: 'revenue', header: 'Ingreso', sortable: true, align: 'right' },
    { key: 'orders', header: 'Órdenes', sortable: true, align: 'right' },
  ], []);

  const breakdownColumns = useMemo(() => [
    { key: 'gateway', header: 'Método', sortable: true },
    { key: 'amount', header: 'Ingreso', sortable: true, align: 'right' },
    { key: 'count', header: 'Órdenes', sortable: true, align: 'right' },
  ], []);

  return (
    <section className={styles.page} aria-labelledby="report-sales-title">
      <header className={styles.header}>
        <h1 id="report-sales-title" className={styles.title}>
          Reporte de ingresos y ventas
        </h1>
        <div className={styles.exportGroup}>
          <button
            type="button"
            className={styles.exportLink}
            onClick={() => exportToCsv(SERIES_CSV_COLUMNS, series, 'reporte-ventas.csv')}
            disabled={series.length === 0}
          >
            Exportar tabla
          </button>
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
          <span>Rango de fechas</span>
          <DateRangePicker
            startDate={fromISODateString(from)}
            endDate={fromISODateString(to)}
            placeholder={['Desde', 'Hasta']}
            onRangeChange={({ startDate, endDate }) => {
              setFrom(toISODateString(startDate));
              setTo(toISODateString(endDate));
            }}
          />
        </label>
      </div>

      {isLoading && <p>Cargando reporte…</p>}
      {error && (
        <p role="alert" className={styles.error}>
          No se pudo cargar el reporte. Intenta de nuevo.
        </p>
      )}

      <div className={styles.totals} aria-label="Totales del periodo">
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Ingresos</span>
          <span className={styles.metricValue}>
            {totals.revenue ?? '—'}
          </span>
          {delta != null && (
            <span className={`${styles.metricDelta} ${deltaClass}`}>
              {delta >= 0 ? '+' : ''}{delta}% vs periodo anterior
            </span>
          )}
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Órdenes</span>
          <span className={styles.metricValue}>{totals.orders ?? 0}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Ticket promedio</span>
          <span className={styles.metricValue}>{totals.average_ticket ?? '—'}</span>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Tendencia del periodo</h2>
      {series.length === 0 ? (
        <p className={styles.empty}>Sin datos en el periodo.</p>
      ) : (
        <>
        <RevenueTrendChart data={series} />
        <DataTable
          columns={seriesColumns}
          rows={series}
          rowKey={(row) => row.date}
          caption="Tendencia del periodo"
        />
        </>
      )}

      <h2 className={styles.sectionTitle}>Desglose por método de pago</h2>
      {breakdown.length === 0 ? (
        <p className={styles.empty}>Sin pagos registrados.</p>
      ) : (
        <DataTable
          columns={breakdownColumns}
          rows={breakdown}
          rowKey={(row) => row.gateway}
          caption="Desglose por método de pago"
        />
      )}
    </section>
  );
}
