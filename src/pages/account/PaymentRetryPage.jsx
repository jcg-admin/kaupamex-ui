/**
 * PaymentRetryPage — PracticaYoruba
 * UC-PAY-08: Reintentar el pago de una orden en PENDIENTE_PAGO,
 * permitiendo cambiar el gateway. Tras crear la nueva preferencia
 * redirige al entorno del gateway.
 */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  retryPayment,
  clearPaymentsActionState,
} from '@redux/slices/paymentsSlice';
import { redirectToGateway } from '@pages/checkout/paymentRedirect';
import styles from './PaymentRetryPage.module.scss';

const GATEWAYS = [
  { value: 'mercadopago', label: 'Mercado Pago' },
  { value: 'paypal',      label: 'PayPal' },
];

export default function PaymentRetryPage() {
  const { orderId } = useParams();
  const dispatch    = useDispatch();
  const { isActioning, actionError, lastInitiation } = useSelector((s) => s.payments);
  const [gateway, setGateway] = useState('mercadopago');

  useEffect(() => () => { dispatch(clearPaymentsActionState()); }, [dispatch]);

  useEffect(() => {
    const url = lastInitiation?.payment_url || lastInitiation?.approve_url;
    if (url) redirectToGateway(url);
  }, [lastInitiation]);

  const onSubmit = (e) => {
    e.preventDefault();
    dispatch(retryPayment({ order_id: orderId, gateway }));
  };

  return (
    <section className={styles.page} aria-labelledby="retry-title">
      <header className={styles.header}>
        <h1 id="retry-title" className={styles.title}>
          Reintentar pago
        </h1>
        <p className={styles.subtitle}>Orden <strong>{orderId}</strong></p>
      </header>

      {actionError && (
        <p role="alert" className={styles.error}>
          {actionError.code || actionError.message || 'No se pudo reintentar el pago.'}
        </p>
      )}

      <form onSubmit={onSubmit} className={styles.form} aria-label="Reintentar pago">
        <fieldset className={styles.fieldset}>
          <legend>Selecciona el metodo de pago</legend>
          {GATEWAYS.map((g) => (
            <label key={g.value} className={styles.option}>
              <input
                type="radio"
                name="gateway"
                value={g.value}
                checked={gateway === g.value}
                onChange={(e) => setGateway(e.target.value)}
              />
              {g.label}
            </label>
          ))}
        </fieldset>
        <button
          type="submit"
          className={styles.primaryBtn}
          disabled={isActioning}
        >
          {isActioning ? 'Procesando…' : 'Reintentar'}
        </button>
      </form>
    </section>
  );
}
