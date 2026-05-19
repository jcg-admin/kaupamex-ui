/**
 * OrdersPage — PracticaYoruba
 * UC-ORD-03: Listado paginado de ordenes del comprador autenticado.
 *
 * Lectura: useCustomerOrders (React Query).
 */
import { Link } from 'react-router-dom';
import { useCustomerOrders } from '@hooks/domain/useOrders';
import styles from './OrdersPage.module.scss';

const STATUS_LABEL = {
  PENDING:        'Pendiente',
  PENDING_PAYMENT:'Pendiente de pago',
  PROCESSING:     'En proceso',
  IN_PREPARATION: 'En preparacion',
  SHIPPED:        'Enviado',
  DELIVERED:      'Entregado',
  CANCELLED:      'Cancelado',
};

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-MX');
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '—';
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return value;
  return num.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export default function OrdersPage() {
  const { data, isLoading, isError } = useCustomerOrders();
  const orders = data?.results ?? [];

  return (
    <section className={styles.page} aria-labelledby="orders-title">
      <header className={styles.header}>
        <h1 id="orders-title" className={styles.title}>Mis pedidos</h1>
      </header>

      {isLoading && <p>Cargando pedidos…</p>}

      {isError && (
        <p role="alert" className={styles.error}>
          No se pudieron cargar tus pedidos. Intenta de nuevo.
        </p>
      )}

      {!isLoading && !isError && orders.length === 0 && (
        <p className={styles.empty}>No tienes pedidos registrados.</p>
      )}

      {orders.length > 0 && (
        <ul className={styles.list}>
          {orders.map((order) => (
            <li key={order.order_number} className={styles.item}>
              <Link to={`/account/orders/${order.order_number}`} className={styles.itemLink}>
                <div className={styles.itemMain}>
                  <span className={styles.itemNumber}>{order.order_number}</span>
                  <span className={styles.itemDate}>{formatDate(order.created_at)}</span>
                </div>
                <div className={styles.itemMeta}>
                  <span className={styles.itemStatus}>
                    {STATUS_LABEL[order.status] ?? order.status_display ?? order.status}
                  </span>
                  <span className={styles.itemTotal}>{formatCurrency(order.total)}</span>
                  <span className={styles.itemCount}>
                    {order.items_count} {order.items_count === 1 ? 'articulo' : 'articulos'}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
