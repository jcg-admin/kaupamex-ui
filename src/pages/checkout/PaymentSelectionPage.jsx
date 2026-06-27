/**
 * PaymentSelectionPage — PracticaYoruba
 *   UC-PAY-01-V2 — MercadoPago Checkout API (on-site CardForm, ADR-018)
 *   UC-PAY-02    — PayPal (Checkout Pro, redirect)
 *
 * MP flow: CardForm renders MP.js iframes → user enters card data →
 *   submit triggers tokenization → token POSTed to /api/v2/payments/initiate/
 *   → backend responds synchronously → show result (no redirect).
 *
 * PayPal flow: button click → POST /api/v1/payments/initiate/ with
 *   gateway: PAYPAL → redirect to checkout_url.
 */
import { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate }            from 'react-router-dom';
import { useDispatch, useSelector }          from 'react-redux';
import {
  initiateCheckoutApiPayment,
  initiatePayPalPayment,
  clearPaymentsActionState,
} from '@redux/slices/paymentsSlice';
import MpCardForm from '@components/checkout/MpCardForm';
import { redirectToGateway } from './paymentRedirect';
import styles from './PaymentSelectionPage.module.scss';

const PAYMENT_RESULT_LABELS = {
  approved:  { text: '¡Pago aprobado!',   cls: 'success' },
  rejected:  { text: 'Pago rechazado.',    cls: 'error'   },
  pending:   { text: 'Pago en proceso.',   cls: 'warning' },
  in_process:{ text: 'Pago en proceso.',   cls: 'warning' },
};

export default function PaymentSelectionPage() {
  const { orderId } = useParams();
  const dispatch    = useDispatch();
  const navigate    = useNavigate();

  // auth.user.email pre-fills the CardForm payer email
  const userEmail = useSelector((s) => s.auth?.user?.email || '');
  const { isActioning, actionError, lastAction, lastInitiation } =
    useSelector((s) => s.payments);

  // amount: ideally comes from order data; falls back to '0.00' — MP.js
  // requires a string amount to calculate installments correctly.
  // In a real flow CheckoutPage passes it via route state or we fetch it.
  const [amount] = useState('0.00');

  // 'select' | 'mp-form' | 'result'
  const [view, setView] = useState('select');

  useEffect(() => () => { dispatch(clearPaymentsActionState()); }, [dispatch]);

  // After PayPal initiation: redirect to gateway URL
  useEffect(() => {
    if (lastAction === 'paypal_initiated') {
      const url = lastInitiation?.checkout_url;
      if (url) redirectToGateway(url);
    }
  }, [lastAction, lastInitiation]);

  // After Checkout API: show result view
  useEffect(() => {
    if (lastAction === 'mp_checkout_api' && lastInitiation) {
      setView('result');
    }
  }, [lastAction, lastInitiation]);

  const onPayPal = () => {
    dispatch(initiatePayPalPayment({ order_number: orderId }));
  };

  const onMpPayment = useCallback(({ token, payment_method_id, issuerId, installments, payer }) => {
    dispatch(initiateCheckoutApiPayment({
      order_number:                orderId,
      token,
      payment_method_id:           payment_method_id,
      issuer_id:                   issuerId,
      installments:                installments ? Number(installments) : undefined,
      payer_email:                 payer?.email,
      payer_identification_type:   payer?.identification?.type,
      payer_identification_number: payer?.identification?.number,
    }));
  }, [dispatch, orderId]);

  const paymentStatus = lastInitiation?.status;
  const resultLabel   = PAYMENT_RESULT_LABELS[paymentStatus] || { text: paymentStatus, cls: 'warning' };

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

      {view === 'result' && lastInitiation && (
        <div className={styles[resultLabel.cls] || styles.gateway} data-testid="payment-result">
          <p className={styles.resultStatus}>{resultLabel.text}</p>
          {lastInitiation.status_detail && (
            <p className={styles.resultDetail}>{lastInitiation.status_detail}</p>
          )}
          <p>Pago: <strong>{lastInitiation.gateway_payment_id || lastInitiation.payment_id}</strong></p>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => navigate(`/order/${orderId}/confirmation`)}
          >
            Ver confirmación
          </button>
        </div>
      )}

      {view !== 'result' && (
        <>
          <div className={styles.gateway}>
            <h2 className={styles.gatewayTitle}>Mercado Pago</h2>
            {view === 'select' && (
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => setView('mp-form')}
                disabled={isActioning}
              >
                Pagar con tarjeta (Mercado Pago)
              </button>
            )}
            {view === 'mp-form' && (
              <MpCardForm
                amount={amount}
                payerEmail={userEmail}
                onPayment={onMpPayment}
                onCancel={() => setView('select')}
              />
            )}
            {isActioning && view === 'mp-form' && (
              <p className={styles.processing} aria-live="polite">
                Procesando pago...
              </p>
            )}
          </div>

          <div className={styles.gateway}>
            <h2 className={styles.gatewayTitle}>PayPal</h2>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={onPayPal}
              disabled={isActioning}
            >
              Pagar con PayPal
            </button>
          </div>

          <p className={styles.legal}>
            {view === 'mp-form'
              ? 'Tus datos de tarjeta son cifrados por Mercado Pago. No los almacenamos.'
              : 'Al continuar, seras redirigido al entorno seguro del proveedor de pagos.'}
          </p>
        </>
      )}
    </section>
  );
}
