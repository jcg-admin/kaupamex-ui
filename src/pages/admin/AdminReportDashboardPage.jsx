/**
 * AdminReportDashboardPage — PracticaYoruba
 * UC-REP-03: Dashboard analitico — vista consolidada del negocio.
 *
 * Sin filtros: muestra KPIs del dia, tendencia ultimos 30 dias,
 * top 5 productos del mes y alertas operativas (tickets, stock).
 */
import { Link } from 'react-router-dom';
import { useAnalyticsDashboard } from '@hooks/domain/useReports';
import styles from './AdminReportPage.module.scss';

export default function AdminReportDashboardPage() {
  const { data, isLoading, error } = useAnalyticsDashboard();

  const today        = data?.today        ?? {};
  const trend        = data?.trend        ?? [];
  const topProducts  = data?.top_products ?? [];
  const openTickets  = data?.open_tickets;
  const lowStock     = data?.low_stock_alerts;

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
          <span className={styles.metricLabel}>Compradores nuevos</span>
          <span className={styles.metricValue}>{today.new_customers ?? 0}</span>
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
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Ingreso</th>
            </tr>
          </thead>
          <tbody>
            {trend.map((row) => (
              <tr key={row.bucket}>
                <td>{row.bucket}</td>
                <td>{row.revenue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className={styles.sectionTitle}>Top 5 productos del mes</h2>
      {topProducts.length === 0 ? (
        <p className={styles.empty}>Sin ventas registradas en el mes.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Producto</th>
              <th>Unidades</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((row, idx) => (
              <tr key={row.product_id}>
                <td>{idx + 1}</td>
                <td>{row.name}</td>
                <td>{row.units}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
