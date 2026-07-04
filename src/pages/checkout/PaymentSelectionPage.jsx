/**
 * PaymentSelectionPage — PracticaYoruba
 *   UC-PAY-01-V2 — MercadoPago Checkout API (CardForm + métodos no-tarjeta)
 *   UC-PAY-13    — Métodos no-tarjeta: OXXO, SPEI, Paycash, cajeros, Cuenta MP
 *
 * Nota: PayPal (UC-PAY-02) NO esta implementado/ofrecido — se removio del
 * front (no se menciona ni se ofrece como metodo de pago al cliente).
 *
 * Estados de pago no-tarjeta:
 *   pending    — voucher generado, esperando pago en sucursal
 *   in_process — pago recibido, procesando (SPEI)
 *   approved   — pago confirmado
 *   cancelled  — voucher vencido sin pago (webhook actualiza a cancelled)
 *   rejected   — pago rechazado
 *
 * Vigencia del voucher: la fecha límite viene en `date_of_expiration` de la
 * respuesta. Vencido el plazo, MP cancela automáticamente y notifica por
 * webhook (manejado en webhooks.py, UC-PAY-03).
 *
 * Nota barcode: MP provee `transaction_data.barcode.content` para renderizar
 * el código de barras inline (requeriría react-barcode, no instalado aún).
 * Se muestra el enlace a `external_resource_url` (voucher MP-hosted) como
 * alternativa equivalente para el usuario.
 */
import { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector }          from 'react-redux';
import {
  initiateCheckoutApiPayment,
  initiateNonCardPayment,
  clearPaymentsActionState,
} from '@redux/slices/paymentsSlice';
import { fetchOrderDetail } from '@redux/slices/ordersSlice';
import MpCardForm        from '@components/checkout/MpCardForm';
import NonCardPaymentForm from '@components/checkout/NonCardPaymentForm';
import { paymentStatusDetail } from '@lib/paymentStatusDetail';
import apiService from '@services/apiService';
import styles from './PaymentSelectionPage.module.scss';

// PG-10: cada cuánto se sondea el estado de un pago diferido (OXXO/SPEI).
const STATUS_POLL_MS = 6000;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CARD_RESULT_LABELS = {
  approved:   { text: '¡Pago aprobado!',            cls: 'success' },
  rejected:   { text: 'No pudimos procesar tu pago', cls: 'error'   },
  pending:    { text: 'Procesando tu pago',          cls: 'warning' },
  in_process: { text: 'Procesando tu pago',          cls: 'warning' },
};

// Métodos MP que no usan CardForm (igual que NON_CARD_METHOD_IDS del backend).
const NON_CARD_IDS = new Set([
  'oxxo', 'clabe', 'paycash', 'banamex', 'serfin', 'bancomer', 'account_money',
]);

// Labels y descripciones para mostrar en el selector estático de métodos.
// En producción estos datos vienen de GET /api/v2/payments/methods/ (usePaymentMethods).
const METHOD_CONFIG = [
  {
    id:          'mp-card',
    label:       'Tarjeta de crédito o débito',
    description: 'Visa, Mastercard, AMEX. Paga en sitio de forma segura.',
    type:        'card',
  },
  {
    id:          'oxxo',
    label:       'OXXO',
    description: 'Genera un ticket y paga en cualquier tienda OXXO.',
    type:        'non-card',
  },
  {
    id:          'clabe',
    label:       'Transferencia SPEI',
    description: 'Recibirás una CLABE interbancaria. Acreditación en 1-60 min.',
    type:        'non-card',
  },
  {
    id:          'paycash',
    label:       'Paycash',
    description: 'Paga con efectivo en tiendas Paycash.',
    type:        'non-card',
  },
  {
    id:          'banamex',
    label:       'Banamex (cajero)',
    description: 'Paga en cajeros Banamex con las instrucciones del voucher.',
    type:        'non-card',
  },
  {
    id:          'serfin',
    label:       'Santander (cajero)',
    description: 'Paga en cajeros Santander.',
    type:        'non-card',
  },
  {
    id:          'bancomer',
    label:       'BBVA Bancomer (cajero)',
    description: 'Paga en cajeros BBVA Bancomer.',
    type:        'non-card',
  },
  {
    id:          'account_money',
    label:       'Cuenta Mercado Pago',
    description: 'Pago inmediato desde tu saldo de Mercado Pago.',
    type:        'non-card',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatExpiry(isoDate) {
  if (!isoDate) return null;
  try {
    return new Date(isoDate).toLocaleString('es-MX', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return isoDate;
  }
}

// ---------------------------------------------------------------------------
// Non-card result panel
// ---------------------------------------------------------------------------

function NonCardResultPanel({ result, orderId, onRetry, navigate }) {
  const status     = result?.status;
  const expiryStr  = formatExpiry(result?.date_of_expiration);
  const clabe      = result?.transaction_data?.financial_institution?.account_id
    || result?.transaction_data?.bank_account_id
    || result?.transaction_data?.clabe;
  const voucherUrl = result?.external_resource_url;

  const statusLabel = {
    approved:   { text: '¡Pago confirmado!',           cls: 'success' },
    pending:    { text: 'Voucher generado — pago pendiente.', cls: 'warning' },
    in_process: { text: 'Procesando tu transferencia.', cls: 'warning' },
    rejected:   { text: 'Pago rechazado.',              cls: 'error'   },
    cancelled:  { text: 'Voucher vencido.',              cls: 'error'   },
  }[status] || { text: status, cls: 'warning' };

  return (
    <div className={styles[statusLabel.cls] || styles.warning} data-testid="non-card-result">
      <p className={styles.resultStatus}>{statusLabel.text}</p>

      {(status === 'pending' || status === 'in_process') && (
        <>
          {voucherUrl && (
            <p>
              <a
                href={voucherUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.voucherLink}
                data-testid="voucher-url"
              >
                Ver voucher / instrucciones de pago
              </a>
            </p>
          )}

          {clabe && (
            <div className={styles.clabeBox} data-testid="clabe-display">
              <p className={styles.clabeLabel}>CLABE interbancaria:</p>
              <p className={styles.clabeNumber}>{clabe}</p>
            </div>
          )}

          {expiryStr && (
            <p className={styles.expiry} data-testid="expiry-display">
              Paga antes del: <strong>{expiryStr}</strong>
            </p>
          )}

          <p className={styles.resultDetail}>
            Te enviaremos confirmación por email cuando recibamos tu pago.
            Si el voucher vence sin pago, podrás intentar de nuevo.
          </p>
        </>
      )}

      {status === 'approved' && (
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={() => navigate(`/order/${orderId}/confirmation`)}
        >
          Ver confirmación
        </button>
      )}

      {(status === 'rejected' || status === 'cancelled') && (
        <button type="button" className={styles.primaryBtn} onClick={onRetry}>
          Intentar de nuevo
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function PaymentSelectionPage() {
  const { orderId } = useParams();
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const location    = useLocation();

  const userEmail = useSelector((s) => s.auth?.user?.email || '');
  const { isActioning, actionError, lastAction, lastInitiation } =
    useSelector((s) => s.payments);

  // H-PP-04: el monto se recibe por navigation-state desde CheckoutPage
  // (confirmAndPay). El estado de auth/nav vive en memoria del módulo y un
  // reload (o un deep-link a esta URL) lo pierde, dejando el monto en '0.00'.
  // Montar el CardForm de MP.js con amount<=0 hace fallar onFormMounted
  // ("No se pudo cargar el formulario de pago"). Por eso, si el monto no viene
  // por navigation-state, se RE-OBTIENE el total autoritativo de la orden
  // (GET /orders/<n>/ → value.total) y no se monta el CardForm hasta tenerlo.
  const orderDetail    = useSelector((s) => s.orders?.current);
  const isLoadingOrder = useSelector((s) => s.orders?.isLoadingDetail ?? false);
  const navAmount      = location.state?.amount;
  const navValid       = Number(navAmount) > 0;

  useEffect(() => {
    if (!navValid) dispatch(fetchOrderDetail(orderId));
  }, [navValid, orderId, dispatch]);

  const recoveredTotal = orderDetail?.order_number === orderId
    ? orderDetail?.value?.total
    : null;
  const amount = navValid
    ? String(navAmount)
    : (Number(recoveredTotal) > 0 ? String(recoveredTotal) : '');
  const amountReady = Number(amount) > 0;

  // view: 'select' | 'mp-card-form' | 'non-card-form' | 'result' | 'non-card-result'
  const [view, setView]                   = useState('select');
  const [selectedMethod, setSelectedMethod] = useState(null);

  useEffect(() => () => { dispatch(clearPaymentsActionState()); }, [dispatch]);

  // Card payment result
  useEffect(() => {
    if (lastAction === 'mp_checkout_api' && lastInitiation) {
      setView('result');
    }
  }, [lastAction, lastInitiation]);

  // Non-card payment result
  useEffect(() => {
    if (lastAction === 'mp_non_card' && lastInitiation) {
      setView('non-card-result');
    }
  }, [lastAction, lastInitiation]);

  // PG-10: los métodos diferidos (OXXO/SPEI) se confirman por webhook. Mientras
  // el pago siga pendiente, se sondea GET /status/ y al acreditarse se navega a
  // la confirmación — el comprador no tiene que refrescar la página.
  const nonCardPending = view === 'non-card-result'
    && ['pending', 'in_process'].includes(lastInitiation?.status);
  useEffect(() => {
    if (!nonCardPending) return undefined;
    const timer = setInterval(async () => {
      try {
        const { data } = await apiService.get(`/api/v2/payments/${orderId}/status/`);
        const st = String(data?.status || '').toLowerCase();
        if (st === 'approved' || st === 'paid') {
          clearInterval(timer);
          navigate(`/order/${orderId}/confirmation`);
        }
      } catch {
        // Reintentar en el siguiente tick; un fallo de red no rompe la espera.
      }
    }, STATUS_POLL_MS);
    return () => clearInterval(timer);
  }, [nonCardPending, orderId, navigate]);

  const onMpPayment = useCallback(({ token, payment_method_id, issuerId, installments, payer }) => {
    dispatch(initiateCheckoutApiPayment({
      order_number:                orderId,
      token,
      payment_method_id,
      issuer_id:                   issuerId,
      installments:                installments ? Number(installments) : undefined,
      payer_email:                 payer?.email,
      payer_identification_type:   payer?.identification?.type,
      payer_identification_number: payer?.identification?.number,
    }));
  }, [dispatch, orderId]);

  const onNonCardSubmit = useCallback(({ order_number, payment_method_id, payer_email }) => {
    dispatch(initiateNonCardPayment({ order_number, payment_method_id, payer_email }));
  }, [dispatch]);

  const onSelectMethod = (method) => {
    setSelectedMethod(method);
    if (method.type === 'card') {
      setView('mp-card-form');
    } else {
      setView('non-card-form');
    }
  };

  const onRetry = () => {
    dispatch(clearPaymentsActionState());
    setSelectedMethod(null);
    setView('select');
  };

  const cardResultLabel = CARD_RESULT_LABELS[lastInitiation?.status] || { text: lastInitiation?.status, cls: 'warning' };

  return (
    <section className={styles.page} aria-labelledby="payment-title">
      <header className={styles.header}>
        <span className={styles.kicker}>Paso 04 · Pago</span>
        <h1 id="payment-title" className={styles.title}>
          Elige tu método de pago
        </h1>
        <p className={styles.subtitle}>
          Orden <strong>{orderId}</strong>
        </p>
      </header>

      {actionError && (
        <p role="alert" className={styles.error}>
          {actionError.detail || actionError.code || actionError.message || 'No se pudo iniciar el pago.'}
        </p>
      )}

      {/* Card payment result */}
      {view === 'result' && lastInitiation && (
        <div className={styles[cardResultLabel.cls] || styles.gateway} data-testid="payment-result">
          <p className={styles.resultStatus}>{cardResultLabel.text}</p>
          {/* PG-08: mensaje humano del status_detail (nunca el código crudo). */}
          {lastInitiation.status_detail && (
            <p className={styles.resultDetail} data-testid="result-detail">
              {paymentStatusDetail(lastInitiation.status_detail).d}
            </p>
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

      {/* Non-card payment result */}
      {view === 'non-card-result' && lastInitiation && (
        <NonCardResultPanel
          result={lastInitiation}
          orderId={orderId}
          onRetry={onRetry}
          navigate={navigate}
        />
      )}

      {/* Method selector */}
      {view === 'select' && (
        <>
          <div className={styles.gateway}>
            <h2 className={styles.gatewayTitle}>Método de pago</h2>
            <ul className={styles.methodList} data-testid="mp-method-list">
              {METHOD_CONFIG.map((method) => (
                <li key={method.id} className={styles.methodItem}>
                  <button
                    type="button"
                    className={styles.methodBtn}
                    onClick={() => onSelectMethod(method)}
                    disabled={isActioning}
                    data-testid={`method-btn-${method.id}`}
                  >
                    <span className={styles.methodLabel}>{method.label}</span>
                    <span className={styles.methodDesc}>{method.description}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <p className={styles.legal}>
            Al continuar, aceptas procesar tu pago a través del proveedor seleccionado.
          </p>
        </>
      )}

      {/* CardForm */}
      {view === 'mp-card-form' && (
        <div className={styles.gateway}>
          <h2 className={styles.gatewayTitle}>Tarjeta de crédito o débito</h2>
          {/* H-PP-04: no montar el CardForm con amount<=0 (rompe MP.js). */}
          {amountReady ? (
            <MpCardForm
              amount={amount}
              payerEmail={userEmail}
              onPayment={onMpPayment}
              onCancel={() => setView('select')}
            />
          ) : isLoadingOrder ? (
            <p className={styles.processing} role="status" aria-live="polite">
              Recuperando el total de tu orden…
            </p>
          ) : (
            <p role="alert" className={styles.error} data-testid="amount-unavailable">
              No pudimos recuperar el total de tu orden. Vuelve al carrito e
              inténtalo de nuevo.
            </p>
          )}
          {isActioning && (
            <p className={styles.processing} aria-live="polite">
              Procesando pago...
            </p>
          )}
        </div>
      )}

      {/* Non-card form */}
      {view === 'non-card-form' && selectedMethod && (
        <div className={styles.gateway}>
          <NonCardPaymentForm
            methodId={selectedMethod.id}
            orderNumber={orderId}
            defaultEmail={userEmail}
            onSubmit={onNonCardSubmit}
            onCancel={() => { setView('select'); setSelectedMethod(null); }}
            isSubmitting={isActioning}
          />
          {isActioning && (
            <p className={styles.processing} aria-live="polite">
              Generando instrucciones de pago...
            </p>
          )}
        </div>
      )}
    </section>
  );
}
