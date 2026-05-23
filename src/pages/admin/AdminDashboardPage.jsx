/**
 * AdminDashboardPage — Práctica Yorùbà
 * Vista general: KPIs + alertas + pedidos recientes.
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchAdminMetrics } from '@redux/slices/adminSlice';
import { MetaTag, Price, Button } from '@components/common/primitives';
import styles from './AdminDashboardPage.module.scss';

export default function AdminDashboardPage() {
  const dispatch = useDispatch();
  const m = useSelector((s) => s.admin?.metrics) || {};

  useEffect(() => { dispatch(fetchAdminMetrics()); }, [dispatch]);

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
            <Link to="/admin/orders" className={styles.cardLink}>Ver todos →</Link>
          </header>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Número</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {(m.recent_orders || []).slice(0, 6).map((o) => (
                <tr key={o.order_number}>
                  <td className={styles.mono}>
                    <Link to={`/admin/orders/${o.order_number}`}>{o.order_number}</Link>
                  </td>
                  <td>{o.customer_name}</td>
                  <td>
                    <span className={`${styles.statusPill} ${styles[`pill_${o.tone || 'muted'}`]}`}>
                      {o.status_label}
                    </span>
                  </td>
                  <td className={styles.right}><Price amount={o.total} size="sm" /></td>
                </tr>
              ))}
              {(!m.recent_orders || m.recent_orders.length === 0) && (
                <tr><td colSpan={4} className={styles.empty}>Sin pedidos recientes</td></tr>
              )}
            </tbody>
          </table>
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
            <Link to="/admin/products" className={styles.cardLink}>Ver todos →</Link>
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
