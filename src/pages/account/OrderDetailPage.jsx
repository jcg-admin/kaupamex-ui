/**
 * OrderDetailPage — PracticaYoruba
 * UC-ORD-02: Detalle de una orden propia.
 *
 * Habilita acciones del comprador:
 *   - Cancelar (UC-ORD-04) si el estado es cancelable
 *   - Editar direccion (UC-ORD-05) si es editable
 *   - Cambiar metodo de envio (UC-ORD-06) si es editable
 *
 * Lectura: useCustomerOrder (React Query).
 * Mutaciones: ordersSlice via Redux.
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { useCustomerOrder, ORDERS_DETAIL_KEY, ORDERS_LIST_KEY } from '@hooks/domain/useOrders';
import {
  cancelOrder,
  updateOrderAddress,
  updateOrderShipping,
  clearOrdersActionState,
} from '@redux/slices/ordersSlice';
import styles from './OrderDetailPage.module.scss';

const STATUS_LABEL = {
  PENDING:         'Pendiente',
  PENDING_PAYMENT: 'Pendiente de pago',
  PROCESSING:      'En proceso',
  IN_PREPARATION:  'En preparacion',
  SHIPPED:         'Enviado',
  DELIVERED:       'Entregado',
  CANCELLED:       'Cancelado',
};

const CANCELLABLE_BY_CUSTOMER = new Set(['PENDING', 'PENDING_PAYMENT', 'PROCESSING']);
const EDITABLE_BY_CUSTOMER    = new Set(['PENDING', 'PENDING_PAYMENT', 'PROCESSING', 'IN_PREPARATION']);

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

const EMPTY_ADDRESS = {
  recipient_name: '', street: '', city: '', state: '',
  zip_code: '', country: 'MX', phone: '',
};

export default function OrderDetailPage() {
  const { id: orderNumber } = useParams();
  const dispatch    = useDispatch();
  const queryClient = useQueryClient();

  const { data: order, isLoading, isError } = useCustomerOrder(orderNumber);
  const { isActioning, actionError, lastAction } = useSelector((s) => s.orders);

  const [showCancel,   setShowCancel]   = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const [showAddress, setShowAddress] = useState(false);
  const [address,     setAddress]     = useState(EMPTY_ADDRESS);

  const [showShipping, setShowShipping] = useState(false);
  const [shippingId,   setShippingId]   = useState('');

  useEffect(() => {
    if (!order?.address) return;
    setAddress({
      recipient_name: order.address.recipient_name ?? '',
      street:         order.address.street ?? '',
      city:           order.address.city ?? '',
      state:          order.address.state ?? '',
      zip_code:       order.address.zip_code ?? '',
      country:        order.address.country ?? 'MX',
      phone:          order.address.phone ?? '',
    });
  }, [order]);

  useEffect(() => {
    if (lastAction === 'cancelled' || lastAction === 'address_updated' || lastAction === 'shipping_updated') {
      queryClient.invalidateQueries({ queryKey: [...ORDERS_DETAIL_KEY, orderNumber] });
      queryClient.invalidateQueries({ queryKey: ORDERS_LIST_KEY });
      setShowCancel(false);
      setShowAddress(false);
      setShowShipping(false);
      setCancelReason('');
      setShippingId('');
      dispatch(clearOrdersActionState());
    }
  }, [lastAction, dispatch, queryClient, orderNumber]);

  if (isLoading) return <p>Cargando pedido…</p>;
  if (isError || !order) {
    return (
      <section className={styles.page}>
        <p role="alert" className={styles.error}>
          No se pudo cargar el pedido.{' '}
          <Link to="/account/orders">Volver a mis pedidos</Link>
        </p>
      </section>
    );
  }

  const statusLabel = STATUS_LABEL[order.status] ?? order.status_display ?? order.status;
  const canCancel   = CANCELLABLE_BY_CUSTOMER.has(order.status);
  const canEdit     = EDITABLE_BY_CUSTOMER.has(order.status);

  const submitCancel = (e) => {
    e.preventDefault();
    dispatch(cancelOrder({ orderNumber, reason: cancelReason }));
  };
  const submitAddress = (e) => {
    e.preventDefault();
    dispatch(updateOrderAddress({ orderNumber, address }));
  };
  const submitShipping = (e) => {
    e.preventDefault();
    dispatch(updateOrderShipping({ orderNumber, shippingMethodId: Number(shippingId) }));
  };

  return (
    <section className={styles.page} aria-labelledby="order-title">
      <header className={styles.header}>
        <h1 id="order-title" className={styles.title}>
          Pedido {order.order_number}
        </h1>
        <p className={styles.meta}>
          <span className={styles.status}>{statusLabel}</span>
          <span className={styles.date}>{formatDate(order.created_at)}</span>
        </p>
      </header>

      <section aria-labelledby="items-title" className={styles.section}>
        <h2 id="items-title">Articulos</h2>
        <ul className={styles.items}>
          {(order.items ?? []).map((item) => (
            <li key={item.id} className={styles.itemRow}>
              <span className={styles.itemName}>
                {item.product_name}
                {item.variant_label ? ` — ${item.variant_label}` : ''}
              </span>
              <span className={styles.itemQty}>x{item.quantity}</span>
              <span className={styles.itemPrice}>{formatCurrency(item.subtotal)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="totals-title" className={styles.section}>
        <h2 id="totals-title">Totales</h2>
        {order.value && (
          <dl className={styles.totals}>
            <dt>Subtotal</dt><dd>{formatCurrency(order.value.subtotal)}</dd>
            <dt>Descuento</dt><dd>{formatCurrency(order.value.discount)}</dd>
            <dt>IVA</dt><dd>{formatCurrency(order.value.tax)}</dd>
            <dt>Envio</dt><dd>{formatCurrency(order.value.shipping_cost)}</dd>
            <dt>Total</dt><dd className={styles.total}>{formatCurrency(order.value.total)}</dd>
          </dl>
        )}
      </section>

      <section aria-labelledby="addr-title" className={styles.section}>
        <h2 id="addr-title">Direccion de entrega</h2>
        {order.address ? (
          <address className={styles.address}>
            {order.address.recipient_name}<br />
            {order.address.street}<br />
            {order.address.city}, {order.address.state} {order.address.zip_code}<br />
            {order.address.country}
          </address>
        ) : <p>—</p>}
        {canEdit && (
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => setShowAddress((v) => !v)}
          >
            {showAddress ? 'Cancelar edicion' : 'Editar direccion'}
          </button>
        )}
        {showAddress && (
          <form onSubmit={submitAddress} className={styles.form} aria-label="Editar direccion">
            <label>Destinatario
              <input
                value={address.recipient_name}
                onChange={(e) => setAddress({ ...address, recipient_name: e.target.value })}
                required
              />
            </label>
            <label>Calle
              <input
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                required
              />
            </label>
            <label>Ciudad
              <input
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                required
              />
            </label>
            <label>Estado
              <input
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                required
              />
            </label>
            <label>Codigo postal
              <input
                value={address.zip_code}
                onChange={(e) => setAddress({ ...address, zip_code: e.target.value })}
                required
              />
            </label>
            <label>Telefono
              <input
                value={address.phone}
                onChange={(e) => setAddress({ ...address, phone: e.target.value })}
              />
            </label>
            <button type="submit" className={styles.primaryBtn} disabled={isActioning}>
              Guardar direccion
            </button>
          </form>
        )}
      </section>

      <section aria-labelledby="ship-title" className={styles.section}>
        <h2 id="ship-title">Metodo de envio</h2>
        <p>{order.shipping_method_name ?? '—'}</p>
        {canEdit && (
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => setShowShipping((v) => !v)}
          >
            {showShipping ? 'Cancelar cambio' : 'Cambiar metodo de envio'}
          </button>
        )}
        {showShipping && (
          <form onSubmit={submitShipping} className={styles.form} aria-label="Cambiar metodo de envio">
            <label>ID del nuevo metodo de envio
              <input
                type="number"
                min="1"
                value={shippingId}
                onChange={(e) => setShippingId(e.target.value)}
                required
              />
            </label>
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={isActioning || !shippingId}
            >
              Aplicar cambio
            </button>
          </form>
        )}
      </section>

      {canCancel && (
        <section aria-labelledby="cancel-title" className={styles.section}>
          <h2 id="cancel-title">Cancelar pedido</h2>
          <button
            type="button"
            className={styles.dangerBtn}
            onClick={() => setShowCancel((v) => !v)}
          >
            {showCancel ? 'No, mantener pedido' : 'Cancelar este pedido'}
          </button>
          {showCancel && (
            <form onSubmit={submitCancel} className={styles.form} aria-label="Cancelar pedido">
              <label>Motivo (opcional)
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                />
              </label>
              <button type="submit" className={styles.dangerBtn} disabled={isActioning}>
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
