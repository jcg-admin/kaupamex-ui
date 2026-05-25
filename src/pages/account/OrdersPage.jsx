/**
 * OrdersPage — Práctica Yorùbà
 * Lista paginada de pedidos del comprador.
 *
 * Endpoints:
 *   GET /orders/?status={status}&page={n}
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchOrders } from '@redux/slices/ordersSlice';
import AccountSidebar from '@components/account/AccountSidebar';
import { MetaTag, Price, Button, EmptyState } from '@components/common/primitives';
import styles from './OrdersPage.module.scss';

const STATUS_FILTERS = [
  { id: 'all',       label: 'Todos' },
  { id: 'active',    label: 'En curso' },
  { id: 'delivered', label: 'Entregados' },
  { id: 'cancelled', label: 'Cancelados' },
];

// H-CICLO32-04: PAGADA y CANCELLED_TIMEOUT existen en el modelo pero faltaban en el mapa.
// Sin ellos, órdenes en esos estados renderizaban "Pendiente" (fallback STATUS_TONE.PENDING).
const STATUS_TONE = {
  PENDING:          { tone: 'muted',  label: 'Pendiente' },
  PROCESSING:       { tone: 'coral',  label: 'Procesando' },
  PAGADA:           { tone: 'coral',  label: 'Pagada' },
  IN_PREPARATION:   { tone: 'coral',  label: 'En preparación' },
  SHIPPED:          { tone: 'coral',  label: 'En camino' },
  DELIVERED:        { tone: 'lime',   label: 'Entregado' },
  CANCELLED:        { tone: 'vino',   label: 'Cancelado' },
  CANCELLED_TIMEOUT:{ tone: 'vino',   label: 'Cancelado (timeout)' },
  REFUNDED:         { tone: 'bronze', label: 'Reembolsado' },
};

export default function OrdersPage() {
  const dispatch = useDispatch();
  const [filter, setFilter] = useState('all');
  const { list = [], isLoading } = useSelector((s) => s.orders || {});

  useEffect(() => { dispatch(fetchOrders({ filter })); }, [dispatch, filter]);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <nav className={styles.breadcrumb}>
          <Link to="/mi-cuenta">Mi cuenta</Link>
          <span>/</span>
          <span className={styles.bcCurrent}>Mis pedidos</span>
        </nav>

        <div className={styles.layout}>
          <AccountSidebar />

          <section>
            <header className={styles.header}>
              <h1 className={styles.title}>Mis pedidos</h1>
              <div className={styles.filters}>
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`${styles.filterBtn} ${filter === f.id ? styles.filterBtnActive : ''}`}
                    onClick={() => setFilter(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </header>

            {isLoading && <div className={styles.loading}>Cargando pedidos…</div>}

            {!isLoading && list.length === 0 && (
              <EmptyState
                icon="◯"
                title="Aún no tienes pedidos"
                description="Cuando hagas tu primer pedido, lo verás aquí con todo el seguimiento."
              >
                <Link to="/catalogo"><Button variant="primary">Ir al catálogo</Button></Link>
              </EmptyState>
            )}

            {!isLoading && list.length > 0 && (
              <div className={styles.list}>
                {list.map((o) => <OrderRow key={o.order_number} order={o} />)}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function OrderRow({ order }) {
  const status = STATUS_TONE[order.status] || STATUS_TONE.PENDING;
  const isActive = ['PROCESSING','IN_PREPARATION','SHIPPED'].includes(order.status);

  return (
    <article className={`${styles.row} ${isActive ? styles.rowActive : ''}`}>
      <div>
        <div className={styles.rowMeta}>
          PEDIDO · {new Date(order.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
        </div>
        <div className={styles.rowNumber}>{order.order_number}</div>
      </div>
      <div>
        <div className={`${styles.rowStatus} ${styles[`tone_${status.tone}`]}`}>
          <span className={styles.rowDot} />
          {status.label}
        </div>
        <div className={styles.rowEta}>
          {order.eta_label || `Actualizado: ${new Date(order.updated_at).toLocaleDateString('es-MX')}`}
        </div>
      </div>
      <div>
        <div className={styles.rowItems}>
          {order.items_count} {order.items_count === 1 ? 'pieza' : 'piezas'}
        </div>
        <Price amount={order.total} size="md" />
      </div>
      <Link to={`/mi-cuenta/pedidos/${order.order_number}`}>
        <Button variant="secondary" size="sm">Ver detalle</Button>
      </Link>
    </article>
  );
}
