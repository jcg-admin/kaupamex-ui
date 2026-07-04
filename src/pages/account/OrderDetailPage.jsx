/**
 * OrderDetailPage — Práctica Yorùbà
 * Detalle de un pedido con timeline + items + dirección + totales.
 *
 * Endpoints:
 *   GET /{order_number}/
 *   POST /{order_number}/cancel/
 *   POST /payments/{n}/refund/
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { fetchOrderDetail } from '@redux/slices/ordersSlice';
import { MetaTag, Price, Button, SumRow } from '@components/common/primitives';
import ShipmentTracking from '@components/account/ShipmentTracking';
import styles from './OrderDetailPage.module.scss';

// H-CICLO108-03: IN_DELIVERY is not a valid Order.status value in the
// model (statuses: PENDING, PROCESSING, IN_PREPARATION, SHIPPED,
// DELIVERED, CANCELLED, CANCELLED_TIMEOUT, REFUNDED, PAID).
// The spurious step made the currentStatusIndex calculation unreliable:
// currentStatusIndex was always -1 for DELIVERED because the DELIVERED
// entry appeared after a non-existent IN_DELIVERY that would shift
// indices. Removed IN_DELIVERY to align with the model's state machine.
// P-03: el paso PENDING NO debe decir "Pago aprobado". Un pedido con pago
// rechazado permanece en estado PENDING (el backend deja Payment=FAILED y
// Order=PENDING, verificado en services.py:493-526), así que rotular PENDING
// como "Pago aprobado" mostraba pago confirmado en pedidos rechazados. El
// pago aprobado es su propio paso (PAID), que el backend fija solo cuando el
// gateway aprueba.
const TIMELINE_STEPS = [
  { id: 'PENDING',        t: 'Pedido creado',      detail: 'Pendiente de pago' },
  { id: 'PROCESSING',     t: 'Procesando pago',    detail: 'Validando el cargo con el gateway' },
  { id: 'PAID',           t: 'Pago aprobado',      detail: 'El gateway confirmó el cargo' },
  { id: 'IN_PREPARATION', t: 'En preparación',     detail: 'Empacado y sellado' },
  { id: 'SHIPPED',        t: 'Enviado',            detail: 'En camino' },
  { id: 'DELIVERED',      t: 'Entregado',          detail: '' },
];

const STATUS_ORDER = TIMELINE_STEPS.map(s => s.id);

export default function OrderDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const order = useSelector((s) => s.orders?.current);
  const isLoading = useSelector((s) => s.orders?.isLoadingDetail);

  useEffect(() => { dispatch(fetchOrderDetail(id)); }, [dispatch, id]);

  if (isLoading || !order) {
    return <main className={styles.loading}>Cargando pedido…</main>;
  }

  const currentStatusIndex = STATUS_ORDER.indexOf(order.status);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <nav className={styles.breadcrumb}>
          <Link to="/account">Mi cuenta</Link><span>/</span>
          <Link to="/account/orders">Mis pedidos</Link><span>/</span>
          <span className={styles.bcCurrent}>{order.order_number}</span>
        </nav>

        {/* Hero */}
        <header className={styles.hero}>
          <div>
            <div className={styles.heroMeta}>
              <MetaTag tone="bronze">Pedido · {new Date(order.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</MetaTag>
              <span>·</span>
              <MetaTag tone="coral">{order.status_display || order.status_label || order.status}</MetaTag>
            </div>
            <h1 className={styles.heroTitle}>{order.order_number}</h1>
            {order.eta && (
              <p className={styles.heroEta}>
                Entrega estimada: <strong>{order.eta}</strong>
              </p>
            )}
          </div>
          <div className={styles.heroActions}>
            {order.invoice_url && (
              <a href={order.invoice_url} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm">Descargar factura</Button>
              </a>
            )}
            {order.tracking_url && (
              <a href={order.tracking_url} target="_blank" rel="noopener noreferrer">
                <Button variant="primary" size="sm">Rastrear ↗</Button>
              </a>
            )}
          </div>
        </header>

        <div className={styles.layout}>
          <div className={styles.mainCol}>
            <Timeline order={order} currentIndex={currentStatusIndex} />
            <ShipmentTracking orderNumber={order.order_number} />
            <ItemsBlock items={order.items || []} />
            <AddressBlock address={order.address} />
          </div>

          <aside className={styles.sideCol}>
            <TotalsCard order={order} />
            <PaymentCard payment={order.payment} />
            <SupportCard order={order} />
          </aside>
        </div>
      </div>
    </main>
  );
}

function Timeline({ order, currentIndex }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Seguimiento del envío</h2>
      <div className={styles.timeline}>
        <div className={styles.timelineRail} />
        {TIMELINE_STEPS.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          // H-CICLO108-02: OrderStatusLogSerializer exposes new_status, not
          // status. Using l.status was always undefined so every timeline
          // step showed "pendiente" even when status_logs was populated.
          const log = (order.status_logs || []).find(l => l.new_status === step.id);
          return (
            <div key={step.id} className={styles.timelineRow}>
              <div className={`${styles.timelineDot} ${done ? styles.timelineDotDone : ''} ${active ? styles.timelineDotActive : ''}`} />
              <div>
                <div className={`${styles.timelineTitle} ${(done || active) ? styles.timelineTitleActive : ''}`}>
                  {step.t}
                </div>
                {step.detail && <div className={styles.timelineDetail}>{step.detail}</div>}
              </div>
              <div className={styles.timelineWhen}>
                {log ? new Date(log.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : 'pendiente'}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ItemsBlock({ items }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Piezas en este pedido</h2>
      <div className={styles.itemsList}>
        {items.map((it, i) => (
          <div key={i} className={styles.itemRow}>
            <div className={styles.itemThumb}>
              {it.image_url ? <img src={it.image_url} alt={it.product_name} /> : null}
            </div>
            <div className={styles.itemInfo}>
              {it.orisha_name && <MetaTag tone="coral">{it.orisha_name}</MetaTag>}
              <div className={styles.itemName}>{it.product_name}</div>
              <div className={styles.itemSku}>
                SKU · {it.sku} · Cantidad {it.quantity}
                {it.variant_label && <> · {it.variant_label}</>}
              </div>
            </div>
            <Price amount={Number(it.subtotal ?? it.unit_price * it.quantity)} size="md" />
          </div>
        ))}
      </div>
    </section>
  );
}

function AddressBlock({ address }) {
  if (!address) return null;
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Dirección de entrega</h2>
      <div className={styles.addressBox}>
        <div>
          <MetaTag tone="bronze">Recibirá</MetaTag>
          <address className={styles.addressLines}>
            <strong>{address.recipient_name}</strong><br />
            {address.street}<br />
            {address.city}<br />
            {address.zip_code} {address.state}, {address.country}<br />
            {address.phone}
          </address>
        </div>
        {address.notes && (
          <div>
            <MetaTag tone="bronze">Notas para el repartidor</MetaTag>
            <p className={styles.addressNotes}>"{address.notes}"</p>
            <div className={styles.addressFootnote}>
              Esta dirección es un snapshot inmutable del pedido
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function TotalsCard({ order }) {
  // H-CICLO32-03: OrderSerializer anida los totales en order.value (OrderValueSerializer).
  // Los campos correctos son order.value.subtotal, order.value.total, etc.
  // order.item_count no existe en OrderSerializer — usar order.items.length.
  const v = order.value || {};
  const itemCount = (order.items || []).length;
  const shippingCost = Number(v.shipping_cost) || 0;
  return (
    <div className={styles.sideCard}>
      <h3 className={styles.sideCardTitle}>Total cobrado</h3>
      <SumRow label={`Subtotal · ${itemCount} piezas`} value={`$${Number(v.subtotal || 0).toLocaleString('es-MX')} MXN`} />
      {order.voucher_code && (
        <SumRow label={`Voucher ${order.voucher_code}`} value={`−$${Number(order.voucher_discount || 0).toLocaleString('es-MX')} MXN`} tone="lime" />
      )}
      <SumRow label="Envío" value={shippingCost > 0 ? `$${shippingCost.toLocaleString('es-MX')} MXN` : 'Gratis'} tone={shippingCost > 0 ? 'default' : 'lime'} />
      <SumRow label="IVA incluido" value={`$${Number(v.tax || 0).toLocaleString('es-MX')} MXN`} muted />
      <div className={styles.sideCardTotal}>
        <span>Total</span>
        <Price amount={Number(v.total) || 0} size="lg" />
      </div>
    </div>
  );
}

function PaymentCard({ payment }) {
  if (!payment) return null;
  return (
    <div className={styles.sideCardOutline}>
      <MetaTag tone="bronze">Forma de pago</MetaTag>
      <div className={styles.paymentMethod}>
        {payment.gateway_label} {payment.card_last4 && `· Tarjeta •••• ${payment.card_last4}`}
      </div>
      <div className={styles.paymentMeta}>
        Cobrado el {new Date(payment.captured_at).toLocaleDateString('es-MX')}
        {payment.installments > 1 && ` · ${payment.installments} cuotas sin intereses`}
      </div>
      <Link to={`/account/orders/${payment.order_number}/historial-pago`} className={styles.paymentLink}>
        VER HISTORIAL DE PAGOS →
      </Link>
    </div>
  );
}

function SupportCard({ order }) {
  const navigate = useNavigate();
  const canRefund = order.status === 'DELIVERED' && !order.refund_requested;
  // H-14: los botones no tenían onClick — eran controles muertos. "Solicitar
  // ayuda" abre un ticket de soporte prellenado con el pedido; "Solicitar
  // reembolso" abre el flujo de devolución. Ambas rutas ya existen en el
  // router (support/tickets/new, account/returns/new); el pedido viaja como
  // query param para que el formulario destino lo asocie.
  const orderRef = encodeURIComponent(order.order_number);
  return (
    <div className={styles.sideCardOutline}>
      <MetaTag tone="bronze">¿Hay algo con tu pedido?</MetaTag>
      <p className={styles.supportText}>
        Si necesitas ayuda con esta entrega o quieres solicitar reembolso, podemos atenderte.
      </p>
      <div className={styles.supportActions}>
        <Button
          variant="secondary"
          block
          size="sm"
          onClick={() => navigate(`/support/tickets/new?order=${orderRef}`)}
        >
          Solicitar ayuda
        </Button>
        {canRefund && (
          <Button
            variant="ghost"
            block
            size="sm"
            onClick={() => navigate(`/account/returns/new?order=${orderRef}`)}
          >
            Solicitar reembolso
          </Button>
        )}
      </div>
    </div>
  );
}
