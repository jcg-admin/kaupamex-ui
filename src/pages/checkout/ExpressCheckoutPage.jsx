/**
 * ExpressCheckoutPage — Práctica Yorùbà
 * One-click checkout para clientes recurrentes con dirección + método guardados.
 *
 * Endpoints:
 *   GET /checkout/eligibility/
 *   POST /checkout/express/
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchCart } from '@redux/slices/cartSlice';
import { fetchExpressEligibility, submitExpress } from '@redux/slices/checkoutSlice';
import { MetaTag, Price, Button, SumRow } from '@components/common/primitives';
import styles from './ExpressCheckoutPage.module.scss';

export default function ExpressCheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cart = useSelector((s) => s.cart || {});
  const eligibility = useSelector((s) => s.checkout?.expressEligibility);
  const { totals = {} } = cart;
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchCart());
    dispatch(fetchExpressEligibility());
  }, [dispatch]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await dispatch(submitExpress()).unwrap();
      if (result.redirect_url) {
        window.location.href = result.redirect_url;
      } else {
        navigate(`/pedido/${result.order_number}/confirmacion`);
      }
    } catch (err) {
      setSubmitting(false);
    }
  };

  if (!eligibility?.eligible) {
    return (
      <main className={styles.page}>
        <div className={styles.notEligible}>
          <h2>Necesitas un pedido más para checkout express</h2>
          <p>El express checkout está disponible para clientes con al menos un pedido previo entregado.</p>
          <Button variant="primary" onClick={() => navigate('/checkout')}>
            Ir al checkout normal
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <MetaTag tone="bronze">Checkout express · solo para clientes recurrentes</MetaTag>
          <h1 className={styles.title}>
            Pagar en <em>un solo paso</em>
          </h1>
          <p className={styles.lead}>
            Usamos tu dirección predeterminada y tu método de pago guardado. Revisa antes
            de confirmar.
          </p>
        </header>

        <div className={styles.layout}>
          <div className={styles.cards}>
            <ExpressCard
              eyebrow={`Enviar a · ${eligibility.address?.alias || 'Casa'}`}
              title={eligibility.address?.recipient_name}
              lines={[
                eligibility.address?.street,
                `${eligibility.address?.neighborhood} · ${eligibility.address?.city} ${eligibility.address?.zip_code}`,
              ]}
              onChange={() => navigate('/mi-cuenta/direcciones')}
            />
            <ExpressCard
              eyebrow="Pagar con · Mercado Pago"
              title={`Tarjeta ••${eligibility.payment_method?.card_last4 || '4218'}`}
              lines={[
                `Vence ${eligibility.payment_method?.expiry || '09/28'} · 6 meses sin intereses disponibles`,
              ]}
              onChange={() => navigate('/checkout')}
            />
            <ExpressCard
              eyebrow="Envío · DHL"
              title="Estándar resguardado · 2 a 4 días"
              lines={['Envío gratis por este pedido']}
            />

            <div className={styles.eligibleBadge}>
              <span className={styles.eligibleCheck}>✓</span>
              <div>
                <strong>Eres apto para checkout express.</strong> Tienes {eligibility.previous_orders || 0} pedidos previos,
                ningún reembolso pendiente y tu método de pago está al día.
              </div>
            </div>
          </div>

          <aside className={styles.summary}>
            <MetaTag tone="bronze">{cart.items?.length || 0} piezas</MetaTag>
            <h3 className={styles.summaryTitle}>Tu pedido</h3>
            <div className={styles.summaryTotals}>
              <SumRow label="Subtotal" value={`$${(totals.subtotal || 0).toLocaleString('es-MX')} MXN`} />
              <SumRow label="Envío" value="Gratis" tone="lime" />
              <SumRow label="IVA incluido" value={`$${(totals.tax_included || 0).toLocaleString('es-MX')} MXN`} muted />
            </div>
            <div className={styles.summaryTotalRow}>
              <span>Total</span>
              <Price amount={totals.total || 0} size="lg" />
            </div>
            <Button variant="primary" block size="lg" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Procesando…' : 'Confirmar y pagar'}
            </Button>
            <button type="button" className={styles.summaryFallback} onClick={() => navigate('/checkout')}>
              Revisar paso a paso →
            </button>
            <div className={styles.summaryFinePrint}>
              Al confirmar aceptas los <a>términos</a>.
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function ExpressCard({ eyebrow, title, lines, onChange }) {
  return (
    <div className={styles.card}>
      <div>
        <MetaTag tone="bronze">{eyebrow}</MetaTag>
        <div className={styles.cardTitle}>{title}</div>
        <div className={styles.cardLines}>
          {lines.filter(Boolean).map((l, i) => <div key={i}>{l}</div>)}
        </div>
      </div>
      {onChange && (
        <button type="button" className={styles.cardChange} onClick={onChange}>
          CAMBIAR
        </button>
      )}
    </div>
  );
}
