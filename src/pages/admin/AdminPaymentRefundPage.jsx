/**
 * AdminPaymentRefundPage — PracticaYoruba
 * UC-PAY-09: El admin procesa manualmente un reembolso sobre un Payment APPROVED.
 *
 * Lectura del Payment: `useAdminPayment` (React Query).
 * Mutacion: `requestAdminRefund` en `paymentsSlice` (canonical pattern).
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminPayment, ADMIN_PAYMENTS_KEY } from '@hooks/domain/usePayments';
import {
  requestAdminRefund,
  clearPaymentsActionState,
} from '@redux/slices/paymentsSlice';
import styles from './AdminPaymentRefundPage.module.scss';

function formatCurrency(value, currency = 'MXN') {
  if (value === null || value === undefined || value === '') return '—';
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return value;
  return num.toLocaleString('es-MX', { style: 'currency', currency });
}

export default function AdminPaymentRefundPage() {
  const { paymentId } = useParams();
  const dispatch      = useDispatch();
  const queryClient   = useQueryClient();
  const { data: payment, isLoading, isError } = useAdminPayment(paymentId);
  const { isActioning, actionError, lastAction } = useSelector((s) => s.payments);

  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState(null);

  useEffect(() => () => { dispatch(clearPaymentsActionState()); }, [dispatch]);

  useEffect(() => {
    if (lastAction === 'refunded') {
      queryClient.invalidateQueries({ queryKey: ADMIN_PAYMENTS_KEY });
    }
  }, [lastAction, queryClient]);

  const onSubmit = (e) => {
    e.preventDefault();
    setValidationError(null);

    const trimmed = reason.trim();
    if (!trimmed) {
      setValidationError('Motivo es obligatorio.');
      return;
    }
    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) {
      setValidationError('Monto invalido.');
      return;
    }
    if (payment && num > Number(payment.amount)) {
      setValidationError('El monto no puede superar el monto del pago.');
      return;
    }
    dispatch(requestAdminRefund({
      payment_id: paymentId,
      amount: num,
      reason: trimmed,
    }));
  };

  if (isLoading) return <p className={styles.page}>Cargando pago…</p>;

  if (isError || !payment) {
    return (
      <section className={styles.page}>
        <p role="alert" className={styles.error}>
          No se encontro el pago solicitado.
        </p>
        <Link to="/admin/payments" className={styles.backLink}>
          ← Volver al listado
        </Link>
      </section>
    );
  }

  return (
    <section className={styles.page} aria-labelledby="refund-title">
      <Link to="/admin/payments" className={styles.backLink}>
        ← Volver al listado
      </Link>

      <header className={styles.header}>
        <h1 id="refund-title" className={styles.title}>
          Procesar reembolso
        </h1>
        <p className={styles.subtitle}>
          Pago <strong>#{payment.id}</strong> · Orden <strong>{payment.order_id}</strong>
        </p>
      </header>

      <dl className={styles.detail}>
        <div><dt>Monto cobrado</dt><dd>{formatCurrency(payment.amount, payment.currency)}</dd></div>
        <div><dt>Gateway</dt><dd>{payment.gateway === 'paypal' ? 'PayPal' : 'Mercado Pago'}</dd></div>
        <div><dt>Estado</dt><dd>{payment.status}</dd></div>
      </dl>

      {actionError && (
        <p role="alert" className={styles.error}>
          {actionError.code || actionError.message || 'No se pudo procesar el reembolso.'}
        </p>
      )}

      {lastAction === 'refunded' && (
        <p className={styles.success}>Reembolso procesado correctamente.</p>
      )}

      <form onSubmit={onSubmit} className={styles.form} aria-label="Formulario de reembolso">
        <label className={styles.field}>
          Monto a reembolsar
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isActioning}
            required
          />
        </label>
        <label className={styles.field}>
          Motivo
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isActioning}
          />
        </label>

        {validationError && (
          <p className={styles.validationError}>{validationError}</p>
        )}

        <button
          type="submit"
          className={styles.primaryBtn}
          disabled={isActioning}
        >
          {isActioning ? 'Procesando…' : 'Procesar reembolso'}
        </button>
      </form>
    </section>
  );
}
