/**
 * OrderSuccessPage — Práctica Yorùbà
 * Confirmación post-pago tras retorno del gateway.
 * Ruta: /order/:id/confirmation
 *
 * Endpoints:
 *   GET /api/v2/orders/{id}/
 *
 * H-PP-B10: esta página SOLO muestra "pedido confirmado" cuando la orden está
 * realmente pagada (Order.status ∈ PAID/SHIPPED/DELIVERED). Antes mostraba
 * "Aprobado" y "$undefined" de forma optimista aunque el pago fuera rechazado
 * o pendiente — el estado real y el total vienen de la orden, no se asumen.
 */

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import apiService from '@services/apiService';
import { MetaTag, Button } from '@components/common/primitives';
import Icon from '@components/common/Icon/Icon';
import styles from './OrderSuccessPage.module.scss';

// Estados de orden que implican pago acreditado.
const PAID_STATUSES = ['PAID', 'SHIPPED', 'DELIVERED'];

function formatMxn(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('es-MX', {
    style: 'currency', currency: 'MXN',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
}

export default function OrderSuccessPage() {
  const { id } = useParams();
  const [order, setOrder]   = useState(null);
  const [loaded, setLoaded] = useState(false);
  // H-CICLO22-05: el campo `user` en OrderSerializer es un PK entero, no un
  // objeto. El nombre y email del comprador autenticado se leen del slice auth.
  const authUser = useSelector((state) => state.auth.user);

  useEffect(() => {
    apiService.get(`/api/v2/orders/${id}/`)
      .then(res => setOrder(res.data))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [id]);

  if (!loaded) return <div className={styles.loading}>Cargando…</div>;

  // Orden no encontrada o no accesible.
  if (!order) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <p role="alert" className={styles.lead}>
            No pudimos cargar tu pedido. Revisa tus pedidos desde tu cuenta.
          </p>
          <Link to="/account/orders"><Button variant="primary">Ver mis pedidos</Button></Link>
        </div>
      </main>
    );
  }

  const isPaid    = PAID_STATUSES.includes(order.status);
  const firstName = authUser?.first_name || '';

  // Pago NO acreditado: no mostrar confirmación falsa. Estado real + reintentar.
  if (!isPaid) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <header className={styles.hero}>
            <MetaTag tone="bronze">
              Pago {order.status_display || order.status || 'no completado'}
            </MetaTag>
            <h1 className={styles.title}>Tu pago aún no se ha confirmado</h1>
            <p className={styles.lead}>
              Tu pedido <strong>{order.order_number}</strong> quedó registrado pero el
              pago no se acreditó. Si el cobro fue rechazado, puedes intentarlo de
              nuevo; si está pendiente (OXXO/SPEI), lo confirmaremos en cuanto el
              banco lo reporte.
            </p>
          </header>
          <div className={styles.facts}>
            <Fact n="01" t="Pago"  v={order.status_display || order.status || 'Pendiente'} sub="estado actual" tone="bronze" />
            <Fact n="02" t="Total" v={formatMxn(order.value?.total)}                       sub="IVA incluido" />
          </div>
          <div className={styles.ctas}>
            <Link to={`/account/orders/${order.order_number}`}>
              <Button variant="primary" block size="lg">Ver el estado de mi pedido</Button>
            </Link>
            <Link to="/catalog">
              <Button variant="secondary" block size="lg">Seguir explorando el catálogo</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const gatewayLabel = order.payment?.gateway_label || 'MercadoPago';
  const payLabel     = order.payment?.status_label || order.status_display || 'Pagado';
  const payId        = order.payment?.gateway_payment_id || '';

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.hero}>
          <div className={styles.checkIcon}><Icon name="check" size={40} /></div>
          <MetaTag tone="lime">Pedido confirmado · {gatewayLabel} aprobó tu pago</MetaTag>
          <h1 className={styles.title}>
            Gracias{firstName ? `, ${firstName}` : ''}. <em>Bendiciones</em> para tu práctica.
          </h1>
          <p className={styles.lead}>
            Tu pedido <strong>{order.order_number}</strong> está confirmado. Te enviamos
            el comprobante y el seguimiento a <strong>{order.guest_email || authUser?.email || ''}</strong>.
          </p>
        </header>

        <div className={styles.facts}>
          <Fact n="01" t="Pago"    v={payLabel}                             sub={payId ? `ID ${payId}` : ''}     tone="lime" />
          <Fact n="02" t="Total"   v={formatMxn(order.value?.total)}        sub="IVA incluido" />
          <Fact n="03" t="Envío"   v={order.shipping_method_name || order.shipping_method_label || 'Envío a domicilio'} sub="2 a 4 días · gratis" />
          <Fact n="04" t="Entrega" v={order.eta || 'En 2-4 días'}           sub="estimada" tone="bronze" />
        </div>

        <section className={styles.nextSteps}>
          <h2 className={styles.sectionTitle}>Qué pasa ahora</h2>
          <div className={styles.nextGrid}>
            <NextStep n="01" t="Empacamos tu pedido"   d="Iniciamos el empaque sellado. Recibirás un correo cuando salga del almacén." eta="Mañana" />
            <NextStep n="02" t="DHL recoge y envía"    d="Te enviamos la guía de rastreo en cuanto DHL lo confirme."                  eta="1-2 días" />
            <NextStep n="03" t="Recibes en tu domicilio" d="DHL contactará el día de la entrega."                                       eta="2-4 días" />
          </div>
        </section>

        <section className={styles.recap}>
          <div>
            <MetaTag tone="bronze">Resumen rápido</MetaTag>
            <div className={styles.recapItems}>
              {(order.items || []).slice(0, 3).map((it, i) => (
                <div key={i} className={styles.recapImg}>
                  {it.image_url ? <img src={it.image_url} alt="" /> : null}
                </div>
              ))}
              <div className={styles.recapText}>
                <div className={styles.recapCount}>
                  {order.item_count} {order.item_count === 1 ? 'pieza' : 'piezas'}
                </div>
                <div className={styles.recapOrishas}>
                  {[...new Set((order.items || []).map(i => i.orisha_name).filter(Boolean))].join(' · ')}
                </div>
              </div>
            </div>
          </div>
          <Link to={`/account/orders/${order.order_number}`}>
            <Button variant="primary">Ver detalle completo</Button>
          </Link>
        </section>

        <div className={styles.ctas}>
          <Link to="/catalog"><Button variant="secondary" block size="lg">Seguir explorando el catálogo</Button></Link>
          <Link to="/info/santoral"><Button variant="secondary" block size="lg">Ver calendario del santoral</Button></Link>
        </div>
      </div>
    </main>
  );
}

function Fact({ n, t, v, sub, tone = 'default' }) {
  const toneClass = {
    lime:   styles.factValueLime,
    bronze: styles.factValueBronze,
    default: '',
  }[tone];
  return (
    <div className={styles.fact}>
      <div className={styles.factN}>{n}</div>
      <div className={styles.factT}>{t}</div>
      <div className={`${styles.factV} ${toneClass}`}>{v}</div>
      <div className={styles.factSub}>{sub}</div>
    </div>
  );
}

function NextStep({ n, t, d, eta }) {
  return (
    <div className={styles.nextStep}>
      <div className={styles.nextStepHeader}>
        <span className={styles.nextStepN}>· {n} ·</span>
        <span className={styles.nextStepEta}>{eta.toUpperCase()}</span>
      </div>
      <h3 className={styles.nextStepT}>{t}</h3>
      <p className={styles.nextStepD}>{d}</p>
    </div>
  );
}
