/**
 * PaymentSelectionPage — PracticaYoruba
 *   UC-PAY-01 — Iniciar pago con Mercado Pago
 *   UC-PAY-02 — Iniciar pago con PayPal
 *   UC-PAY-01-EXT — Pago con cuotas sin intereses (MSI) via Mercado Pago
 *
 * Pagina del paso de pago del checkout. Permite al comprador
 * seleccionar el gateway y, opcionalmente, el numero de cuotas MSI.
 * Tras la creacion de la preferencia, redirige al entorno del gateway.
 *
 * Lectura de la orden: el `orderId` viene como parametro de ruta.
 * Mutaciones: `paymentsSlice` via Redux.
 */
import { useEffect, useState } from 'react';
import { useParams }           from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  initiateMercadoPagoPayment,
  initiatePayPalPayment,
  clearPaymentsActionState,
} from '@redux/slices/paymentsSlice';
import { redirectToGateway } from './paymentRedirect';
import styles from './PaymentSelectionPage.module.scss';

const MSI_OPTIONS = [
  { value: '',  label: 'Sin cuotas' },
  { value: '3', label: '3 meses sin intereses' },
  { value: '6', label: '6 meses sin intereses' },
  { value: '9', label: '9 meses sin intereses' },
];

export default function PaymentSelectionPage() {
  const { orderId } = useParams();
  const dispatch    = useDispatch();
  const { isActioning, actionError, lastInitiation } = useSelector((s) => s.payments);

  const [installments, setInstallments] = useState('');

  useEffect(() => () => { dispatch(clearPaymentsActionState()); }, [dispatch]);

  useEffect(() => {
    // DEC-BC-09: backend devuelve `checkout_url` (unico campo, no
    // payment_url/approve_url separados por gateway).
    const url = lastInitiation?.checkout_url;
    if (url) redirectToGateway(url);
  }, [lastInitiation]);

  const onPayMP = () => {
    // DEC-BC-09: backend espera `order_number` (no order_id). El
    // parametro URL :orderId ya es el order_number string PY-XXXX
    // (per CheckoutPage redireccion line 41-42).
    const payload = { order_number: orderId };
    if (installments) payload.installments = installments;
    dispatch(initiateMercadoPagoPayment(payload));
  };

  const onPayPP = () => {
    dispatch(initiatePayPalPayment({ order_number: orderId }));
  };

  return (
    <section className={styles.page} aria-labelledby="payment-title">
      <header className={styles.header}>
        <h1 id="payment-title" className={styles.title}>
          Elige tu metodo de pago
        </h1>
        <p className={styles.subtitle}>
          Orden <strong>{orderId}</strong>
        </p>
      </header>

      {actionError && (
        <p role="alert" className={styles.error}>
          {actionError.code || actionError.message || 'No se pudo iniciar el pago.'}
        </p>
      )}

      <div className={styles.gateway}>
        <h2 className={styles.gatewayTitle}>Mercado Pago</h2>
        <label className={styles.installments}>
          Cuotas sin intereses
          <select
            value={installments}
            onChange={(e) => setInstallments(e.target.value)}
            disabled={isActioning}
          >
            {MSI_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={onPayMP}
          disabled={isActioning}
        >
          Pagar con Mercado Pago
        </button>
      </div>

      <div className={styles.gateway}>
        <h2 className={styles.gatewayTitle}>PayPal</h2>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={onPayPP}
          disabled={isActioning}
        >
          Pagar con PayPal
        </button>
      </div>

      <p className={styles.legal}>
        Al continuar, seras redirigido al entorno seguro del proveedor de pagos.
      </p>
    </section>
  );
}
