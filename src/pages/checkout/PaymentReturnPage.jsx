/**
 * PaymentReturnPage — Práctica Yorùbà
 * Pantalla intermedia mientras se verifica el pago con el gateway.
 * Polling cada 5s a /payments/{n}/status/ hasta APPROVED / FAILED.
 * Ruta: /checkout/payment-return/:id
 *
 * Endpoints:
 *   GET /payments/{n}/status/
 */

import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MetaTag } from '@components/common/primitives';
import apiService from '@services/apiService';
import styles from './PaymentReturnPage.module.scss';

const POLL_INTERVAL = 5000;
const MAX_ATTEMPTS = 12; // 60s total

export default function PaymentReturnPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState('PENDING');
  const timeoutRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function poll(n) {
      if (cancelled) return;
      try {
        const res = await apiService.get(`/payments/${id}/status/`);
        if (cancelled) return;
        // apiService returns { data, status, headers }; payment status is in data
        const paymentStatus = res.data?.status;
        setStatus(paymentStatus);
        if (paymentStatus === 'APPROVED') {
          navigate(`/order/${id}/confirmation`, { replace: true });
          return;
        }
        if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
          navigate(`/order/${id}/payment-failed`, { replace: true });
          return;
        }
      } catch (e) {
        // Ignorar y seguir intentando
      }

      if (n + 1 >= MAX_ATTEMPTS) {
        setStatus('TIMEOUT');
        return;
      }
      setAttempt(n + 1);
      timeoutRef.current = setTimeout(() => poll(n + 1), POLL_INTERVAL);
    }

    poll(0);
    return () => {
      cancelled = true;
      clearTimeout(timeoutRef.current);
    };
  }, [id, navigate]);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.spinnerWrap}>
          <div className={styles.spinnerOuter} />
          <div className={styles.spinnerInner} />
          <span className={styles.spinnerIcon}>↻</span>
        </div>

        <MetaTag tone="bronze">Confirmando tu pago</MetaTag>
        <h1 className={styles.title}>
          Mercado Pago está <em>verificando</em> tu pago
        </h1>
        <p className={styles.lead}>
          Esto toma normalmente menos de 30 segundos.{' '}
          <strong>No cierres esta ventana ni recargues la página.</strong>
        </p>

        <div className={styles.steps}>
          <Step n="01" t="Pago enviado" sub="al gateway" state="done" />
          <Step n="02" t="Verificando"  sub="con MercadoPago" state={status === 'TIMEOUT' ? 'pending' : 'active'} />
          <Step n="03" t="Confirmar"    sub="en tu cuenta"   state="pending" />
        </div>

        {status === 'TIMEOUT' ? (
          <div className={styles.timeoutBox}>
            Estamos confirmando tu pago. Te enviaremos un correo en cuanto se complete.
            Si pasaron más de unos minutos, contacta a soporte.
          </div>
        ) : (
          <div className={styles.infoBox}>
            <span className={styles.infoIcon}>i</span>
            <div>
              Pedido <strong>{id}</strong> · si tarda más de 1 minuto, te enviaremos
              el estado por correo. Tu pago no se cobra dos veces.
            </div>
          </div>
        )}

        <div className={styles.attemptMeta}>
          INTENTO {String(attempt + 1).padStart(2, '0')} / POLLING CADA 5s
        </div>
      </div>
    </main>
  );
}

function Step({ n, t, sub, state }) {
  return (
    <div className={`${styles.step} ${styles[`step_${state}`]}`}>
      <div className={styles.stepN}>{state === 'done' ? '✓' : n}</div>
      <div className={styles.stepT}>{t}</div>
      <div className={styles.stepSub}>{sub}</div>
    </div>
  );
}
