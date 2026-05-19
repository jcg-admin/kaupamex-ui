/**
 * AdminOrderDetailPage — PracticaYoruba
 * UC-ORD-07: Detalle administrativo + transicion de estado.
 * UC-ORD-08: Cancelacion administrativa con motivo obligatorio.
 *
 * Lectura: useAdminOrder (React Query).
 * Mutaciones: adminTransitionOrderStatus, adminCancelOrder (Redux).
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import {
  useAdminOrder,
  ADMIN_ORDER_DETAIL_KEY,
  ADMIN_ORDERS_LIST_KEY,
} from '@hooks/domain/useOrders';
import {
  adminTransitionOrderStatus,
  adminCancelOrder,
  clearOrdersActionState,
} from '@redux/slices/ordersSlice';
import styles from './AdminOrderDetailPage.module.scss';

const STATUS_LABEL = {
  PENDING:        'Pendiente',
  PENDING_PAYMENT:'Pendiente de pago',
  PROCESSING:     'En proceso',
  IN_PREPARATION: 'En preparacion',
  SHIPPED:        'Enviado',
  DELIVERED:      'Entregado',
  CANCELLED:      'Cancelado',
};

// H-ADM-002: transiciones permitidas (alineadas con admin_services).
const ALLOWED_TRANSITIONS = {
  PENDING:        ['PROCESSING', 'CANCELLED'],
  PROCESSING:     ['IN_PREPARATION', 'CANCELLED'],
  IN_PREPARATION: ['SHIPPED'],
  SHIPPED:        ['DELIVERED'],
};

const ADMIN_CANCELLABLE = new Set(['PENDING', 'PROCESSING', 'IN_PREPARATION']);

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '—';
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return value;
  return num.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-MX');
}

export default function AdminOrderDetailPage() {
  const { id: orderNumber } = useParams();
  const dispatch    = useDispatch();
  const queryClient = useQueryClient();

  const { data: order, isLoading, isError } = useAdminOrder(orderNumber);
  const { isActioning, actionError, lastAction } = useSelector((s) => s.orders);

  const [newStatus,       setNewStatus]       = useState('');
  const [statusNotes,     setStatusNotes]     = useState('');
  const [showCancel,      setShowCancel]      = useState(false);
  const [cancelReason,    setCancelReason]    = useState('');

  useEffect(() => {
    if (lastAction === 'admin_transitioned' || lastAction === 'admin_cancelled') {
      queryClient.invalidateQueries({ queryKey: [...ADMIN_ORDER_DETAIL_KEY, orderNumber] });
      queryClient.invalidateQueries({ queryKey: ADMIN_ORDERS_LIST_KEY });
      setNewStatus('');
      setStatusNotes('');
      setShowCancel(false);
      setCancelReason('');
      dispatch(clearOrdersActionState());
    }
  }, [lastAction, dispatch, queryClient, orderNumber]);

  if (isLoading) return <p>Cargando pedido…</p>;
  if (isError || !order) {
    return (
      <section className={styles.page}>
        <p role="alert" className={styles.error}>
          No se pudo cargar el pedido.{' '}
          <Link to="/admin/orders">Volver al listado</Link>
        </p>
      </section>
    );
  }

  const statusLabel = STATUS_LABEL[order.status] ?? order.status_display ?? order.status;
  const allowed     = ALLOWED_TRANSITIONS[order.status] ?? [];
  const canCancel   = ADMIN_CANCELLABLE.has(order.status);

  const submitTransition = (e) => {
    e.preventDefault();
    dispatch(adminTransitionOrderStatus({
      orderNumber,
      newStatus,
      notes: statusNotes,
    }));
  };
  const submitCancel = (e) => {
    e.preventDefault();
    dispatch(adminCancelOrder({ orderNumber, reason: cancelReason }));
  };

  return (
    <section className={styles.page} aria-labelledby="admin-order-title">
      <header className={styles.header}>
        <h1 id="admin-order-title" className={styles.title}>
          Pedido {order.order_number}
        </h1>
        <p className={styles.meta}>
          <span className={styles.status}>{statusLabel}</span>
          <span className={styles.date}>{formatDate(order.created_at)}</span>
        </p>
      </header>

      <section aria-labelledby="customer-title" className={styles.section}>
        <h2 id="customer-title">Comprador</h2>
        <p>{order.user?.email ?? order.guest_email ?? '—'}</p>
      </section>

      <section aria-labelledby="items-title" className={styles.section}>
        <h2 id="items-title">Articulos</h2>
        <ul className={styles.items}>
          {(order.items ?? []).map((item) => (
            <li key={item.id} className={styles.itemRow}>
              <span>{item.product_name}{item.variant_label ? ` — ${item.variant_label}` : ''}</span>
              <span>x{item.quantity}</span>
              <span>{formatCurrency(item.subtotal)}</span>
            </li>
          ))}
        </ul>
      </section>

      {order.value && (
        <section aria-labelledby="totals-title" className={styles.section}>
          <h2 id="totals-title">Totales</h2>
          <dl className={styles.totals}>
            <dt>Subtotal</dt><dd>{formatCurrency(order.value.subtotal)}</dd>
            <dt>IVA</dt><dd>{formatCurrency(order.value.tax)}</dd>
            <dt>Envio</dt><dd>{formatCurrency(order.value.shipping_cost)}</dd>
            <dt>Total</dt><dd className={styles.total}>{formatCurrency(order.value.total)}</dd>
          </dl>
        </section>
      )}

      {allowed.length > 0 && (
        <section aria-labelledby="transition-title" className={styles.section}>
          <h2 id="transition-title">Cambiar estado</h2>
          <form onSubmit={submitTransition} className={styles.form} aria-label="Cambiar estado de la orden">
            <label>Nuevo estado
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} required>
                <option value="">Selecciona…</option>
                {allowed.map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>
                ))}
              </select>
            </label>
            <label>Notas internas (opcional)
              <textarea
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                rows={2}
              />
            </label>
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={isActioning || !newStatus}
            >
              Aplicar transicion
            </button>
          </form>
        </section>
      )}

      {canCancel && (
        <section aria-labelledby="admin-cancel-title" className={styles.section}>
          <h2 id="admin-cancel-title">Cancelar pedido (admin)</h2>
          <button
            type="button"
            className={styles.dangerBtn}
            onClick={() => setShowCancel((v) => !v)}
          >
            {showCancel ? 'No, mantener pedido' : 'Cancelar este pedido'}
          </button>
          {showCancel && (
            <form
              onSubmit={submitCancel}
              className={styles.form}
              aria-label="Cancelacion administrativa"
            >
              <label>Motivo (obligatorio, minimo 10 caracteres)
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  minLength={10}
                  required
                />
              </label>
              <button
                type="submit"
                className={styles.dangerBtn}
                disabled={isActioning || cancelReason.trim().length < 10}
              >
                Confirmar cancelacion
              </button>
            </form>
          )}
        </section>
      )}

      {actionError && (
        <p role="alert" className={styles.error}>
          {actionError.message ?? 'Ocurrio un error al ejecutar la accion.'}
        </p>
      )}
    </section>
  );
}
