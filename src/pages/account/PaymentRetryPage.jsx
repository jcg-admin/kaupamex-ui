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
import RadioGroup from '@components/common/RadioGroup/RadioGroup';
import styles from './PaymentRetryPage.module.scss';

const GATEWAYS = [
  { value: 'mercadopago', label: 'Mercado Pago' },
];

export default function PaymentRetryPage() {
  const { orderId } = useParams();
  const dispatch    = useDispatch();
  const { isActioning, actionError, lastInitiation } = useSelector((s) => s.payments);
  const [gateway, setGateway] = useState('mercadopago');

  useEffect(() => () => { dispatch(clearPaymentsActionState()); }, [dispatch]);

  useEffect(() => {
    // DEC-BC-09: backend devuelve `checkout_url` unificado.
    const url = lastInitiation?.checkout_url;
    if (url) redirectToGateway(url);
  }, [lastInitiation]);

  const onSubmit = (e) => {
    e.preventDefault();
    // DEC-BC-09: backend espera `order_number`. gateway en uppercase
    // canon: MERCADOPAGO/PAYPAL (no mercadopago/paypal).
    dispatch(retryPayment({
      order_number: orderId,
      gateway: gateway.toUpperCase(),
    }));
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
          <legend>Selecciona el método de pago</legend>
          <RadioGroup
            name="gateway"
            data={GATEWAYS}
            value={gateway}
            onChange={(e) => setGateway(e.target.value)}
          />
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
