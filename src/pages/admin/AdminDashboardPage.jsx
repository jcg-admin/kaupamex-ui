/**
 * AdminDashboardPage — Práctica Yorùbà
 * Vista general: KPIs + alertas + pedidos recientes.
 */

import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchAdminMetrics } from '@redux/slices/adminSlice';
import { MetaTag, Price, Button } from '@components/common/primitives';
import { DataTable } from '@components/common/DataTable/DataTable';
import styles from './AdminDashboardPage.module.scss';

export default function AdminDashboardPage() {
  const dispatch = useDispatch();
  const m = useSelector((s) => s.admin?.metrics) || {};
  const isLoadingMetrics = useSelector((s) => s.admin?.isLoadingMetrics);
  const metricsError     = useSelector((s) => s.admin?.metricsError);

  useEffect(() => { dispatch(fetchAdminMetrics()); }, [dispatch]);

  const recentOrderColumns = useMemo(() => [
    {
      key: 'order_number',
      header: 'Número',
      sortable: true,
      render: (o) => (
        <span className={styles.mono}>
          <Link to={`/admin/pedidos/${o.order_number}`}>{o.order_number}</Link>
        </span>
      ),
    },
    { key: 'customer_name', header: 'Cliente', sortable: true },
    {
      key: 'status_label',
      header: 'Estado',
      sortable: true,
      render: (o) => (
        <span className={`${styles.statusPill} ${styles[`pill_${o.tone || 'muted'}`]}`}>
          {o.status_label}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      sortable: true,
      align: 'right',
      value: (o) => Number(o.total ?? 0),
      render: (o) => <Price amount={o.total} size="sm" />,
    },
  ], []);

  const recentOrders = (m.recent_orders || []).slice(0, 6);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <MetaTag tone="bronze">Panel administrativo</MetaTag>
          <h1 className={styles.title}>Resumen del día</h1>
          <div className={styles.headerMeta}>
            Hoy · {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary">Exportar reporte</Button>
        </div>
      </header>

      {isLoadingMetrics && (
        <p className={styles.loading}>Cargando métricas…</p>
      )}
      {metricsError && (
        <p role="alert" className={styles.apiError}>
          {metricsError.message ?? 'No se pudieron cargar las métricas del panel.'}
        </p>
      )}

      {/* KPIs */}
      <section className={styles.kpis}>
        <Kpi
          label="Ventas del día"
          value={`$${(m.sales_today || 0).toLocaleString('es-MX')} MXN`}
          delta={m.sales_delta_pct}
          tone="lime"
        />
        <Kpi
          label="Pedidos del día"
          value={m.orders_today || 0}
          delta={m.orders_delta_pct}
          tone="coral"
        />
        <Kpi
          label="Ticket promedio"
          value={`$${(m.avg_ticket || 0).toLocaleString('es-MX')} MXN`}
          delta={m.ticket_delta_pct}
          tone="bronze"
        />
        <Kpi
          label="Nuevos usuarios"
          value={m.new_users_today || 0}
          delta={m.users_delta_pct}
          tone="muted"
        />
      </section>

      <div className={styles.grid}>
        {/* Recent orders */}
        <section className={styles.card}>
          <header className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Pedidos recientes</h2>
            <Link to="/admin/pedidos" className={styles.cardLink}>Ver todos →</Link>
          </header>
          <DataTable
            columns={recentOrderColumns}
            rows={recentOrders}
            rowKey={(o) => o.order_number}
            emptyText="Sin pedidos recientes"
            caption="Pedidos recientes"
          />
        </section>

        {/* Alerts */}
        <section className={styles.card}>
          <header className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Alertas</h2>
            <span className={styles.cardBadge}>{(m.alerts || []).length}</span>
          </header>
          <ul className={styles.alertList}>
            {(m.alerts || []).map((a, i) => (
              <li key={i} className={`${styles.alert} ${styles[`alert_${a.severity || 'info'}`]}`}>
                <span className={styles.alertDot} />
                <div>
                  <div className={styles.alertTitle}>{a.title}</div>
                  <div className={styles.alertDesc}>{a.description}</div>
                </div>
                {a.action_to && <Link to={a.action_to} className={styles.alertCta}>→</Link>}
              </li>
            ))}
            {(!m.alerts || m.alerts.length === 0) && (
              <li className={styles.empty}>Sin alertas pendientes ✓</li>
            )}
          </ul>
        </section>

        {/* Top products */}
        <section className={styles.card}>
          <header className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Top productos · 30 días</h2>
            <Link to="/admin/productos" className={styles.cardLink}>Ver todos →</Link>
          </header>
          <ul className={styles.topList}>
            {(m.top_products || []).slice(0, 5).map((p, i) => (
              <li key={p.id} className={styles.topItem}>
                <span className={styles.topRank}>{String(i + 1).padStart(2, '0')}</span>
                <div className={styles.topInfo}>
                  <div className={styles.topName}>{p.name}</div>
                  <div className={styles.topMeta}>{p.orisha_name} · {p.units_sold} vendidos</div>
                </div>
                <Price amount={p.revenue} size="sm" />
              </li>
            ))}
          </ul>
        </section>

        {/* By òrìsà */}
        <section className={styles.card}>
          <header className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Ventas por òrìsà</h2>
          </header>
          <div className={styles.barList}>
            {(m.sales_by_orisha || []).map((o) => (
              <div key={o.orisha} className={styles.bar}>
                <div className={styles.barLabel}>{o.orisha}</div>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${o.pct}%` }} />
                </div>
                <div className={styles.barValue}>{o.pct}%</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Kpi({ label, value, delta, tone }) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className={styles.kpi}>
      <div className={styles.kpiLabel}>{label}</div>
      <div className={`${styles.kpiValue} ${styles[`kpi_${tone}`]}`}>{value}</div>
      {delta != null && (
        <div className={`${styles.kpiDelta} ${positive ? styles.kpiDeltaUp : styles.kpiDeltaDown}`}>
          {positive ? '↑' : '↓'} {Math.abs(delta)}% vs ayer
        </div>
      )}
    </div>
  );
}
