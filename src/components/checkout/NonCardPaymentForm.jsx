/**
 * NonCardPaymentForm — Kaupamex
 *
 * Formulario para métodos de pago que no requieren datos de tarjeta:
 * OXXO, SPEI, Paycash, Banamex, Santander, BBVA, Cuenta Mercado Pago.
 *
 * Solo requiere el email del pagador para que MP pueda enviar el
 * voucher/instrucciones por email.
 */
import { useState } from 'react';
import LoadingButton from '@components/common/LoadingButton/LoadingButton';
import styles from './NonCardPaymentForm.module.scss';

const METHOD_LABELS = {
  oxxo:           'OXXO',
  clabe:          'Transferencia SPEI',
  paycash:        'Paycash',
  banamex:        'Banamex (cajero)',
  serfin:         'Santander (cajero)',
  bancomer:       'BBVA Bancomer (cajero)',
  account_money:  'Cuenta Mercado Pago',
};

const METHOD_DESCRIPTIONS = {
  oxxo:          'Recibirás un código de barras. Paga en cualquier tienda OXXO.',
  clabe:         'Recibirás una CLABE interbancaria para hacer tu transferencia SPEI.',
  paycash:       'Recibirás un código para pagar en tiendas Paycash.',
  banamex:       'Recibirás instrucciones para pagar en cajeros Banamex.',
  serfin:        'Recibirás instrucciones para pagar en cajeros Santander.',
  bancomer:      'Recibirás instrucciones para pagar en cajeros BBVA Bancomer.',
  account_money: 'El pago se procesará inmediatamente desde tu Cuenta Mercado Pago.',
};

export default function NonCardPaymentForm({
  methodId,
  orderNumber,
  defaultEmail = '',
  onSubmit,
  onCancel,
  isSubmitting = false,
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [emailError, setEmailError] = useState('');

  const label       = METHOD_LABELS[methodId] || methodId;
  const description = METHOD_DESCRIPTIONS[methodId] || '';

  function handleSubmit(e) {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Ingresa un email válido para recibir las instrucciones de pago.');
      return;
    }
    setEmailError('');
    onSubmit({ order_number: orderNumber, payment_method_id: methodId, payer_email: email });
  }

  return (
    <div className={styles.container} data-testid="non-card-payment-form">
      <h3 className={styles.title}>{label}</h3>
      <p className={styles.description}>{description}</p>

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <div className={styles.field}>
          <label htmlFor="payer-email" className={styles.label}>
            Email para instrucciones de pago
          </label>
          <input
            id="payer-email"
            type="email"
            className={styles.input}
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@email.com"
            autoComplete="email"
            disabled={isSubmitting}
            data-testid="payer-email-input"
          />
          {emailError && (
            <span className={styles.error} role="alert" data-testid="email-error">
              {emailError}
            </span>
          )}
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cambiar método
          </button>
          <LoadingButton
            type="submit"
            variant="primary"
            className={styles.submitButton}
            loading={isSubmitting}
            disabled={isSubmitting}
            disabledOnLoading
            data-testid="non-card-submit-btn"
          >
            {isSubmitting ? 'Procesando…' : `Pagar con ${label}`}
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}
