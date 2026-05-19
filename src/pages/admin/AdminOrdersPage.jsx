/**
 * AdminOrdersPage — PracticaYoruba
 * UC-ORD-09: Listado/filtro de ordenes para administradores.
 *
 * Filtros acumulativos (AND): order_number, status, email, date_from, date_to.
 * Lectura: useAdminOrders (React Query).
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminOrders } from '@hooks/domain/useOrders';
import styles from './AdminOrdersPage.module.scss';

const STATUS_LABEL = {
  PENDING:        'Pendiente',
  PENDING_PAYMENT:'Pendiente de pago',
  PROCESSING:     'En proceso',
  IN_PREPARATION: 'En preparacion',
  SHIPPED:        'Enviado',
  DELIVERED:      'Entregado',
  CANCELLED:      'Cancelado',
};

const STATUS_OPTIONS = [
  { value: '',              label: 'Todos' },
  { value: 'PENDING',        label: 'Pendiente' },
  { value: 'PROCESSING',     label: 'En proceso' },
  { value: 'IN_PREPARATION', label: 'En preparacion' },
  { value: 'SHIPPED',        label: 'Enviado' },
  { value: 'DELIVERED',      label: 'Entregado' },
  { value: 'CANCELLED',      label: 'Cancelado' },
];

const EMPTY_FILTERS = {
  order_number: '',
  status:       '',
  email:        '',
  date_from:    '',
  date_to:      '',
};

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-MX');
}

export default function AdminOrdersPage() {
  const [draft,   setDraft]   = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);

  const apiParams = Object.fromEntries(
    Object.entries(applied).filter(([, v]) => v),
  );
  const { data, isLoading, isError } = useAdminOrders(apiParams);
  const orders = data?.results ?? [];

  const setField = (k) => (e) => setDraft({ ...draft, [k]: e.target.value });
  const onSubmit = (e) => {
    e.preventDefault();
    setApplied(draft);
  };
  const onReset = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
  };

  return (
    <section className={styles.page} aria-labelledby="admin-orders-title">
      <header className={styles.header}>
        <h1 id="admin-orders-title" className={styles.title}>Pedidos</h1>
      </header>

      <form
        onSubmit={onSubmit}
        className={styles.filters}
        aria-label="Filtros de busqueda de pedidos"
      >
        <label>Numero de orden
          <input
            value={draft.order_number}
            onChange={setField('order_number')}
            placeholder="PY-2026-000123"
          />
        </label>
        <label>Estado
          <select value={draft.status} onChange={setField('status')}>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
        <label>Email del comprador
          <input value={draft.email} onChange={setField('email')} />
        </label>
        <label>Desde
          <input type="date" value={draft.date_from} onChange={setField('date_from')} />
        </label>
        <label>Hasta
          <input type="date" value={draft.date_to} onChange={setField('date_to')} />
        </label>
        <div className={styles.actions}>
          <button type="submit" className={styles.primaryBtn}>Aplicar filtros</button>
          <button type="button" className={styles.secondaryBtn} onClick={onReset}>Limpiar</button>
        </div>
      </form>

      {isLoading && <p>Cargando pedidos…</p>}

      {isError && (
        <p role="alert" className={styles.error}>
          No se pudieron cargar los pedidos. Intenta de nuevo.
        </p>
      )}

      {!isLoading && !isError && orders.length === 0 && (
        <p className={styles.empty}>No hay pedidos que coincidan con los filtros.</p>
      )}

      {orders.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Numero</th>
              <th scope="col">Estado</th>
              <th scope="col">Fecha</th>
              <th scope="col">Total</th>
              <th scope="col">Comprador</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.order_number}>
                <td>{order.order_number}</td>
                <td>{STATUS_LABEL[order.status] ?? order.status_display ?? order.status}</td>
                <td>{formatDate(order.created_at)}</td>
                <td>{order.value?.total ?? order.total ?? '—'}</td>
                <td>{order.user?.email ?? order.guest_email ?? '—'}</td>
                <td>
                  <Link to={`/admin/orders/${order.order_number}`}>Ver detalle</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
