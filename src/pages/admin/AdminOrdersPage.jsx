/**
 * AdminOrdersPage — Práctica Yorùbà
 * Tabla de pedidos con filtros por estado y rango de fechas.
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchAdminOrders } from '@redux/slices/adminSlice';
import { MetaTag, Button, Price } from '@components/common/primitives';
import styles from './AdminTablePage.module.scss';

const STATUS_FILTERS = [
  { id: 'all',            label: 'Todos' },
  { id: 'pending',        label: 'Pendiente pago' },
  { id: 'processing',     label: 'Procesando' },
  { id: 'in_preparation', label: 'Preparación' },
  { id: 'shipped',        label: 'En camino' },
  { id: 'delivered',      label: 'Entregado' },
  { id: 'cancelled',      label: 'Cancelado' },
  { id: 'refunded',       label: 'Reembolsado' },
];

const STATUS_TONE = {
  PENDING:        'muted',
  PROCESSING:     'coral',
  IN_PREPARATION: 'coral',
  SHIPPED:        'coral',
  DELIVERED:      'lime',
  CANCELLED:      'vino',
  REFUNDED:       'bronze',
};

export default function AdminOrdersPage() {
  const dispatch = useDispatch();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const orders = useSelector((s) => s.admin?.orders || []);
  const isLoading = useSelector((s) => s.admin?.isLoadingOrders);

  useEffect(() => { dispatch(fetchAdminOrders({ filter, search })); }, [dispatch, filter, search]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <MetaTag tone="bronze">Operación · {orders.length} pedidos</MetaTag>
          <h1 className={styles.title}>Pedidos</h1>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary">Exportar CSV</Button>
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.id}
              className={`${styles.filterBtn} ${filter === s.id ? styles.filterBtnActive : ''}`}
              onClick={() => setFilter(s.id)}
            >{s.label}</button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Buscar por número o cliente…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.search}
        />
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Items</th>
              <th>Total</th>
              <th>Pago</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={8} className={styles.loading}>Cargando pedidos…</td></tr>}
            {!isLoading && orders.length === 0 && (
              <tr><td colSpan={8} className={styles.empty}>Sin pedidos que coincidan</td></tr>
            )}
            {!isLoading && orders.map((o) => (
              <tr key={o.order_number}>
                <td>
                  <Link to={`/admin/orders/${o.order_number}`} className={`${styles.itemName} ${styles.mono}`}>
                    {o.order_number}
                  </Link>
                </td>
                <td className={styles.mono}>
                  {new Date(o.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td>
                  <div>{o.customer_name}</div>
                  <div className={styles.muted}>{o.customer_email}</div>
                </td>
                <td className={styles.mono}>{o.item_count}</td>
                <td className={styles.right}><Price amount={o.total} size="sm" /></td>
                <td>
                  <span className={`${styles.statusPill} ${styles[`pill_${o.payment_status === 'APPROVED' ? 'lime' : o.payment_status === 'FAILED' ? 'vino' : 'muted'}`]}`}>
                    {o.payment_status_label || o.payment_status}
                  </span>
                </td>
                <td>
                  <span className={`${styles.statusPill} ${styles[`pill_${STATUS_TONE[o.status] || 'muted'}`]}`}>
                    {o.status_label || o.status}
                  </span>
                </td>
                <td className={styles.actions}>
                  <Link to={`/admin/orders/${o.order_number}`} className={styles.actionBtn} title="Ver">→</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
