/**
 * AdminReportDashboardPage — Kaupamex
 * UC-REP-03: Dashboard analitico — vista consolidada del negocio.
 *
 * Sin filtros: muestra KPIs del dia, tendencia ultimos 30 dias,
 * top 5 productos del mes y alertas operativas (tickets, stock).
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAnalyticsDashboard } from '@hooks/domain/useReports';
import { DataTable } from '@components/common/DataTable/DataTable';
import styles from './AdminReportPage.module.scss';

export default function AdminReportDashboardPage() {
  const { data, isLoading, error } = useAnalyticsDashboard();

  const today        = data?.today        ?? {};
  const trend        = data?.trend        ?? [];
  const topProducts  = data?.top_products ?? [];
  const openTickets  = data?.open_tickets;
  const lowStock     = data?.low_stock_alerts;

  const trendColumns = useMemo(() => [
    { key: 'date', header: 'Fecha', sortable: true },
    { key: 'revenue', header: 'Ingreso', sortable: true, align: 'right' },
  ], []);

  const topColumns = useMemo(() => [
    { key: 'rank', header: '#', align: 'right' },
    { key: 'product_name', header: 'Producto', sortable: true },
    { key: 'units_sold', header: 'Unidades', sortable: true, align: 'right' },
  ], []);

  // Rango (#) precalculado por orden de llegada de la API (top 5 del mes),
  // preservado como campo de fila para que el orden por columna no lo altere.
  const topProductsRows = useMemo(
    () => (data?.top_products ?? []).map((row, idx) => ({ ...row, rank: idx + 1 })),
    [data?.top_products],
  );

  return (
    <section className={styles.page} aria-labelledby="report-dashboard-title">
      <header className={styles.header}>
        <h1 id="report-dashboard-title" className={styles.title}>
          Dashboard analítico
        </h1>
      </header>

      {isLoading && <p>Cargando dashboard…</p>}
      {error && (
        <p role="alert" className={styles.error}>
          No se pudo cargar el dashboard. Intenta de nuevo.
        </p>
      )}

      <h2 className={styles.sectionTitle}>Hoy</h2>
      <div className={styles.totals} aria-label="KPIs del día">
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Ingreso</span>
          <span className={styles.metricValue}>{today.revenue ?? '—'}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Órdenes</span>
          <span className={styles.metricValue}>{today.orders ?? 0}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Ticket promedio</span>
          <span className={styles.metricValue}>
            {today.revenue && today.orders
              ? (Number(today.revenue) / today.orders).toFixed(2)
              : '—'}
          </span>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Operación</h2>
      <div className={styles.totals} aria-label="Métricas operativas">
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Tickets de soporte abiertos</span>
          <span className={styles.metricValue}>{openTickets ?? 0}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Alertas de stock bajo</span>
          <span className={styles.metricValue}>{lowStock ?? 0}</span>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Tendencia (últimos 30 días)</h2>
      {trend.length === 0 ? (
        <p className={styles.empty}>Sin datos en la ventana.</p>
      ) : (
        <DataTable
          columns={trendColumns}
          rows={trend}
          rowKey={(row) => row.date}
          caption="Tendencia (últimos 30 días)"
        />
      )}

      <h2 className={styles.sectionTitle}>Top 5 productos del mes</h2>
      {topProducts.length === 0 ? (
        <p className={styles.empty}>Sin ventas registradas en el mes.</p>
      ) : (
        <DataTable
          columns={topColumns}
          rows={topProductsRows}
          rowKey={(row) => row.product_id}
          caption="Top 5 productos del mes"
        />
      )}

      <h2 className={styles.sectionTitle}>Accesos directos</h2>
      <div className={styles.exportGroup}>
        <Link to="/admin/reports/sales" className={styles.exportLink}>
          Ver reporte de ventas
        </Link>
        <Link to="/admin/reports/top-sellers" className={styles.exportLink}>
          Ver top sellers
        </Link>
        <Link to="/admin/reports/customers-rfm" className={styles.exportLink}>
          Ver clientes (RFM)
        </Link>
      </div>
    </section>
  );
}
