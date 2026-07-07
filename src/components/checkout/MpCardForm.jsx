/**
 * MpCardForm — MercadoPago Checkout API on-site card form
 *
 * Renders the fields MP.js CardForm binds by DOM id: div placeholders for
 * the secure iframe fields (card number, expiry, CVV) and real inputs/selects
 * for the non-secure fields (cardholder name/email, document, issuer, cuotas).
 * Delegates SDK lifecycle to useMpCardForm hook.
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

export default function MpCardForm({ amount, payerEmail = '', onPayment, onCancel }) {
  const handlePayment = useCallback((data) => {
    if (onPayment) onPayment(data);
  }, [onPayment]);

  const { status, error, submit } = useMpCardForm({
    amount,
    payer_email: payerEmail,
    onPayment: handlePayment,
  });

  const isReady   = status === 'ready';
  const isLoading = status === 'loading' || status === 'idle';

  return (
    <div className={styles.wrapper} data-testid="mp-card-form">
      {error && (
        <p role="alert" className={styles.error}>{error}</p>
      )}

      <form id="mp-card-form" className={styles.form}>
        <div className={styles.row}>
          <label className={styles.label} htmlFor="mp-card-number">
            Número de tarjeta
            <div id="mp-card-number" className={styles.iframe} />
          </label>
        </div>

        <div className={styles.row2}>
          <label className={styles.label} htmlFor="mp-expiration-date">
            Vencimiento
            <div id="mp-expiration-date" className={styles.iframe} />
          </label>
          <label className={styles.label} htmlFor="mp-security-code">
            CVV
            <div id="mp-security-code" className={styles.iframe} />
          </label>
        </div>

        <div className={styles.row}>
          <label className={styles.label} htmlFor="mp-cardholder-name">
            Titular
            <input
              id="mp-cardholder-name"
              type="text"
              autoComplete="cc-name"
              className={styles.input}
            />
          </label>
        </div>

        <div className={styles.row}>
          <label className={styles.label} htmlFor="mp-cardholder-email">
            Email del pagador
            <input
              id="mp-cardholder-email"
              type="email"
              autoComplete="email"
              className={styles.input}
            />
          </label>
        </div>

        <div className={styles.row2}>
          <label className={styles.label} htmlFor="mp-id-type">
            Tipo de documento
            <select id="mp-id-type" className={styles.select} />
          </label>
          <label className={styles.label} htmlFor="mp-id-number">
            Número de documento
            <input
              id="mp-id-number"
              type="text"
              inputMode="numeric"
              className={styles.input}
            />
          </label>
        </div>

        <div className={styles.row}>
          <label className={styles.label} htmlFor="mp-issuer">
            Banco emisor
            <select id="mp-issuer" className={styles.select} />
          </label>
        </div>

        <div className={styles.row}>
          <label className={styles.label} htmlFor="mp-installments">
            Cuotas
            <select id="mp-installments" className={styles.select} />
          </label>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.submitBtn}
            disabled={!isReady}
            onClick={submit}
            aria-busy={isLoading}
          >
            {isLoading ? 'Cargando...' : 'Pagar con tarjeta'}
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
      </form>
    </div>
  );
}
