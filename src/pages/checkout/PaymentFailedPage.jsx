/**
 * PaymentFailedPage — Práctica Yorùbà
 * Pantalla de rechazo de pago con razón legible + reintento.
 * Ruta: /order/:id/payment-failed
 *
 * Endpoints:
 *   GET /api/v2/orders/{id}/
 *   GET /api/v2/payments/{id}/history/
 */

import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import apiService from '@services/apiService';
import { MetaTag, Button } from '@components/common/primitives';
import Icon from '@components/common/Icon/Icon';
import { paymentStatusDetail } from '@lib/paymentStatusDetail';
import styles from './PaymentFailedPage.module.scss';


export default function PaymentFailedPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    apiService.get(`/api/v2/orders/${id}/`).then(res => setOrder(res.data)).catch(() => {});
    apiService.get(`/api/v2/payments/${id}/history/`).then(res => setHistory(res?.data || [])).catch(() => {});
  }, [id]);

  if (!order) return <div className={styles.loading}>Cargando…</div>;

  const lastFailed = history.find((h) => h.status === 'FAILED') || {};
  const errorInfo = paymentStatusDetail(lastFailed.gateway_error_code);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.hero}>
          <div className={styles.xIcon}><Icon name="x" size={40} /></div>
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
          <Button
            variant="primary"
            size="lg"
            block
            onClick={() => navigate(`/checkout/payment/${id}`)}
          >
            Reintentar con otra tarjeta
          </Button>
          <Button
            variant="secondary"
            size="lg"
            block
            onClick={() => navigate(`/checkout/payment/${id}`)}
          >
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
          <Link to="/help" className={styles.supportLink}>Contactar soporte <Icon name="arrow-right" size={14} /></Link>
        </div>
      </div>
    </main>
  );
}
