/**
 * AdminDashboardPage — PracticaYoruba
 * Landing del panel admin (ruta `/admin`).
 *
 * Centraliza:
 *   - tarjetas con KPIs (pedidos hoy, ingresos, ordenes pendientes,
 *     proximas a expirar, tickets abiertos, devoluciones nuevas,
 *     low-stock) — alimentadas por `useAdminDashboard` (UC-ORD-10)
 *   - panel de accesos rapidos a las secciones criticas del CMS
 *
 * Si el endpoint del dashboard no responde, los KPIs muestran "—"
 * y el resto del layout sigue siendo navegable.
 */
import { Link } from 'react-router-dom';
import { useAdminDashboard } from '@hooks/domain/useOrders';
import styles from './AdminDashboardPage.module.scss';

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '—';
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return value;
  return num.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

const QUICK_LINKS = [
  { to: '/admin/products',             label: 'Productos' },
  { to: '/admin/categories',           label: 'Categorias' },
  { to: '/admin/orders',               label: 'Pedidos' },
  { to: '/admin/orders-dashboard',     label: 'Transaccional' },
  { to: '/admin/inventory',            label: 'Inventario' },
  { to: '/admin/returns',              label: 'Devoluciones' },
  { to: '/admin/support',              label: 'Soporte' },
  { to: '/admin/vouchers',             label: 'Cupones' },
  { to: '/admin/product-discounts',    label: 'Descuentos' },
  { to: '/admin/reports',              label: 'Reportes' },
  { to: '/admin/notifications/compose', label: 'Notificaciones' },
  { to: '/admin/users',                label: 'Usuarios' },
];

export default function AdminDashboardPage() {
  const { data, isLoading, isError } = useAdminDashboard();

  const counts        = data?.order_counts ?? {};
  const daySummary    = data?.day_summary ?? {};
  const expiringCount = (data?.expiring_orders ?? []).length;
  const supportOpen   = data?.support_open ?? null;
  const returnsNew    = data?.returns_new ?? null;
  const lowStock      = data?.low_stock_count ?? null;

  const kpis = [
    {
      label: 'Pedidos pendientes',
      value: isError ? '—' : (counts.PENDING ?? '—'),
      to:    '/admin/orders?status=PENDING',
    },
    {
      label: 'En proceso',
      value: isError ? '—' : (counts.PROCESSING ?? '—'),
      to:    '/admin/orders?status=PROCESSING',
    },
    {
      label: 'Por expirar',
      value: isError ? '—' : expiringCount,
      to:    '/admin/orders-dashboard',
    },
    {
      label: 'Ingresos del dia',
      value: isError ? '—' : formatCurrency(daySummary.revenue ?? daySummary.total ?? null),
      to:    '/admin/reports/sales',
    },
    {
      label: 'Pagos aprobados hoy',
      value: isError ? '—' : (daySummary.approved_count ?? daySummary.count ?? '—'),
      to:    '/admin/orders-dashboard',
    },
    {
      label: 'Tickets abiertos',
      value: supportOpen ?? '—',
      to:    '/admin/support',
    },
    {
      label: 'Devoluciones nuevas',
      value: returnsNew ?? '—',
      to:    '/admin/returns',
    },
    {
      label: 'Bajo stock',
      value: lowStock ?? '—',
      to:    '/admin/inventory',
    },
  ];

  return (
    <section className={styles.page} aria-labelledby="dash-title">
      <header className={styles.header}>
        <h1 id="dash-title" className={styles.title}>
          Panel de administracion
        </h1>
        <p className={styles.subtitle}>
          Resumen del dia y acceso rapido a las secciones operativas.
        </p>
      </header>

      {isLoading && (
        <p className={styles.muted} role="status">
          Cargando indicadores…
        </p>
      )}
      {isError && (
        <p role="alert" className={styles.error}>
          No se pudo cargar el resumen transaccional. Las metricas se
          muestran como "—" hasta restablecer la conexion.
        </p>
      )}

      <ul className={styles.kpiGrid} data-testid="admin-kpi-grid">
        {kpis.map(({ label, value, to }) => (
          <li key={label} className={styles.kpiCard}>
            <Link to={to} className={styles.kpiLink}>
              <span className={styles.kpiLabel}>{label}</span>
              <span className={styles.kpiValue}>{value}</span>
            </Link>
          </li>
        ))}
      </ul>

      <section aria-labelledby="quick-title" className={styles.quickSection}>
        <h2 id="quick-title" className={styles.sectionTitle}>
          Accesos rapidos
        </h2>
        <ul className={styles.quickGrid}>
          {QUICK_LINKS.map(({ to, label }) => (
            <li key={to}>
              <Link to={to} className={styles.quickLink}>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
