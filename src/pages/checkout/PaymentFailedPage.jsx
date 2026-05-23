/**
 * PaymentFailedPage — Práctica Yorùbà
 * Pantalla de rechazo de pago con razón legible + reintento.
 * Pedido reservado 24 hrs.
 *
 * Endpoints:
 *   GET /payments/{n}/retry-eligibility/
 *   GET /payments/{n}/history/
 *   POST /payments/initiate/  (con misma orden, nuevo intento)
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { fetchOrderDetail } from '@redux/slices/ordersSlice';
import { fetchPaymentHistory, retryPayment } from '@redux/slices/checkoutSlice';
import { MetaTag, Button } from '@components/common/primitives';
import styles from './PaymentFailedPage.module.scss';

const ERROR_MESSAGES = {
  cc_rejected_insufficient_amount:    { t: 'Fondos insuficientes', d: 'El banco emisor de tu tarjeta no autorizó el cargo. Verifica tu límite de crédito o intenta con otra tarjeta.' },
  cc_rejected_bad_filled_card_number: { t: 'Número de tarjeta incorrecto', d: 'Verifica los datos de la tarjeta e intenta de nuevo.' },
  cc_rejected_bad_filled_security_code: { t: 'CVV incorrecto', d: 'Verifica el código de seguridad al reverso de tu tarjeta.' },
  cc_rejected_bad_filled_date:        { t: 'Fecha de vencimiento incorrecta', d: 'Verifica la fecha de expiración de tu tarjeta.' },
  cc_rejected_call_for_authorize:     { t: 'Autorización requerida', d: 'Debes autorizar el monto con tu banco antes de reintentar.' },
  cc_rejected_other_reason:           { t: 'Pago rechazado', d: 'Tu banco rechazó el cargo. Intenta con otro método de pago.' },
};

export default function PaymentFailedPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const order = useSelector((s) => s.orders?.current);
  const history = useSelector((s) => s.checkout?.paymentHistory || []);

  useEffect(() => {
    dispatch(fetchOrderDetail(id));
    dispatch(fetchPaymentHistory(id));
  }, [dispatch, id]);

  if (!order) return <div className={styles.loading}>Cargando…</div>;

  const lastFailed = history.find(h => h.status === 'FAILED') || {};
  const errorInfo = ERROR_MESSAGES[lastFailed.gateway_error_code] || ERROR_MESSAGES.cc_rejected_other_reason;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.hero}>
          <div className={styles.xIcon}>✕</div>
          <MetaTag tone="vino">Pago no completado</MetaTag>
          <h1 className={styles.title}>
            Mercado Pago <em>rechazó</em> tu pago
          </h1>
          <p className={styles.lead}>
            Tu pedido <strong>{order.order_number}</strong> está reservado por 24 horas.
            Puedes reintentar con la misma tarjeta o cambiar de método de pago.
          </p>
        </header>

        <section className={styles.reasonBox}>
          <MetaTag tone="bronze">Razón del rechazo</MetaTag>
          <div className={styles.reasonCard}>
            <h3 className={styles.reasonTitle}>{errorInfo.t}</h3>
            <p className={styles.reasonDesc}>{errorInfo.d}</p>
            <div className={styles.reasonMeta}>
              CÓDIGO {lastFailed.gateway_error_code || 'N/A'} · INTENTO {String(history.length).padStart(2, '0')}
            </div>
          </div>
        </section>

        <div className={styles.actions}>
          <Button variant="primary" size="lg" block onClick={() => dispatch(retryPayment({ order: id, gateway: 'mp' }))}>
            Reintentar con otra tarjeta
          </Button>
          <Button variant="secondary" size="lg" block onClick={() => dispatch(retryPayment({ order: id, gateway: 'spei' }))}>
            Cambiar a SPEI o OXXO
          </Button>
        </div>

        <section className={styles.history}>
          <MetaTag tone="bronze">Historial de intentos</MetaTag>
          <div className={styles.historyList}>
            {history.map((h, i) => (
              <div key={i} className={styles.historyRow}>
                <span className={styles.historyWhen}>
                  {new Date(h.created_at).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
                <span>{h.gateway_label} · {h.card_last4 ? `Tarjeta ••${h.card_last4}` : '—'}</span>
                <span className={styles.historyStatus}>● {h.status_label || h.status}</span>
              </div>
            ))}
          </div>
        </section>

        <div className={styles.supportBox}>
          <span>¿Necesitas ayuda? Podemos atenderte por correo o teléfono.</span>
          <Link to="/ayuda" className={styles.supportLink}>Contactar soporte →</Link>
        </div>
      </div>
    </main>
  );
}
