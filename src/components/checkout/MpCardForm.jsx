/**
 * MpCardForm — MercadoPago Checkout API on-site card form
 *
 * Renders the fields MP.js CardForm binds by DOM id: div placeholders for
 * the secure iframe fields (card number, expiry, security code) and real
 * inputs/selects for the non-secure fields (cardholder name/email, document,
 * issuer, cuotas). Delegates SDK lifecycle to useMpCardForm hook.
 *
 * UX notes (documented in docs pasarela initiative):
 *  - Visibility of system status (Nielsen): loading/ready/processing states,
 *    real MP error surfaced, live brand detection from the BIN.
 *  - Error prevention: submit stays grayed until the form is valid; the
 *    security-code hint adapts to the detected brand (Amex 4 front / 3 back).
 *  - Recognition over recall: brand icon + universal "Código de seguridad"
 *    label instead of CVV/CVC/CID jargon.
 *  - UX writing: action-oriented microcopy; the button shows the real amount.
 *
 * Props:
 *   amount     {string}   — total amount string ("199.00")
 *   payerEmail {string}   — pre-fill payer email (optional)
 *   onPayment  {function} — called with tokenized card data
 *   onCancel   {function} — called when user clicks "Cancelar"
 */

import { useCallback } from 'react';
import { useMpCardForm } from '@hooks/useMpCardForm';
import styles from './MpCardForm.module.scss';

function LockIcon() {
  return (
    <svg
      className={styles.lockIcon}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function formatAmount(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

// Brand-aware security-code hint (recognition over recall + error prevention).
function securityCodeHint(brand) {
  if (!brand) return '3 o 4 dígitos, según tu tarjeta.';
  if (brand.cvvLocation === 'front') {
    return `${brand.cvvLength || 4} dígitos al frente de tu tarjeta.`;
  }
  return `${brand.cvvLength || 3} dígitos al reverso de tu tarjeta.`;
}

export default function MpCardForm({
  amount,
  payerEmail = '',
  cardholderName = '',
  onPayment,
  onCancel,
}) {
  const handlePayment = useCallback((data) => {
    if (onPayment) onPayment(data);
  }, [onPayment]);

  const { status, error, submit, brand, valid } = useMpCardForm({
    amount,
    payer_email: payerEmail,
    cardholder_name: cardholderName,
    onPayment: handlePayment,
  });

  const isReady   = status === 'ready';
  const isLoading = status === 'loading' || status === 'idle';
  // Grayed default state: enable only when the form is ready AND valid. `valid`
  // is undefined under the test mock → treat only an explicit false as invalid.
  const canSubmit = isReady && valid !== false;
  const amountLabel = formatAmount(amount);

  return (
    <div className={styles.wrapper} data-testid="mp-card-form">
      <div className={styles.secureNote}>
        <LockIcon />
        <span>Pago cifrado con MercadoPago</span>
      </div>

      {error && (
        <p role="alert" className={styles.error}>{error}</p>
      )}

      {status === 'error' && (
        <button
          type="button"
          className={styles.reloadBtn}
          onClick={() => window.location.reload()}
          data-testid="mp-reload-btn"
        >
          Recargar para reintentar el pago
        </button>
      )}

      <form id="mp-card-form" className={styles.form}>
        <div className={styles.row}>
          {/* Not a <label>: MP renders the secure field as a <div> (iframe
              host), which is not a labelable element, so htmlFor is invalid.
              The accessible name lives on the field host via aria-label. */}
          <div className={styles.label}>
            <span className={styles.labelRow}>
              <span>Número de tarjeta</span>
              {brand && (
                <span className={styles.brandBadge}>
                  {brand.thumbnail && (
                    <img
                      src={brand.thumbnail}
                      alt={brand.name || 'Tarjeta'}
                      className={styles.brandIcon}
                    />
                  )}
                  <span className={styles.brandName}>{brand.name}</span>
                </span>
              )}
            </span>
            <div id="mp-card-number" className={styles.iframe} aria-label="Número de tarjeta" />
          </div>
        </div>

        <div className={styles.row2}>
          <div className={styles.label}>
            Vencimiento
            <div id="mp-expiration-date" className={styles.iframe} aria-label="Vencimiento" />
          </div>
          <div className={styles.label}>
            Código de seguridad
            <div id="mp-security-code" className={styles.iframe} aria-label="Código de seguridad" />
            <span className={styles.hint}>{securityCodeHint(brand)}</span>
          </div>
        </div>

        <div className={styles.row}>
          <label className={styles.label} htmlFor="mp-cardholder-name">
            Titular de la tarjeta
            <input
              id="mp-cardholder-name"
              type="text"
              autoComplete="cc-name"
              className={styles.input}
            />
          </label>
        </div>

        {/* Email del pagador: se obtiene del paso anterior (la cuenta). MP.js
            requiere el campo en el DOM y lo pre-llena con el valor; lo
            ocultamos para no pedir que se re-escriba. */}
        <div className={styles.hiddenField} aria-hidden="true">
          <label htmlFor="mp-cardholder-email">
            Email del pagador
            <input
              id="mp-cardholder-email"
              type="email"
              autoComplete="email"
              tabIndex={-1}
            />
          </label>
        </div>

        <div className={styles.row}>
          <label className={styles.label} htmlFor="mp-issuer">
            Banco emisor
            <select id="mp-issuer" className={styles.select} />
          </label>
        </div>

        {/* Cuotas: MP.js REQUIERE el campo en el DOM para completar el montaje
            (sin él, onFormMounted nunca dispara — H-PP-07). Lo ocultamos porque
            no ofrecemos meses sin intereses: MP lo rellena y toma 1 cuota. */}
        <div className={styles.hiddenField} aria-hidden="true">
          <label htmlFor="mp-installments">
            Cuotas
            <select id="mp-installments" tabIndex={-1} />
          </label>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.submitBtn}
            disabled={!canSubmit}
            onClick={submit}
            aria-busy={isLoading}
          >
            <LockIcon />
            {isLoading
              ? 'Procesando…'
              : `Pagar con tarjeta${amountLabel ? ` · ${amountLabel}` : ''}`}
          </button>
          {onCancel && (
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onCancel}
            >
              Cancelar
            </button>
          )}
        </div>

        <p className={styles.trustNote}>
          No almacenamos los datos de tu tarjeta. Los procesa MercadoPago de
          forma segura.
        </p>
      </form>
    </div>
  );
}
