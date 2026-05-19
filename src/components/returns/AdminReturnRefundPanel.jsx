/**
 * AdminReturnRefundPanel — PracticaYoruba
 * UC-RET-06: Procesar el reembolso de una devolución COMPLETADA.
 * Muestra el resumen del pago original, deja ajustar el monto y dispara
 * la llamada al gateway via processReturnRefund.
 */
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { processReturnRefund } from '@redux/slices/returnsSlice';
import styles from './AdminReturnRefundPanel.module.scss';

function initialAmount(returnRequest) {
  if (!returnRequest) return 0;
  if (typeof returnRequest.refund_amount_suggested === 'number') {
    return returnRequest.refund_amount_suggested;
  }
  return returnRequest.payment?.amount ?? 0;
}

export default function AdminReturnRefundPanel({ returnRequest }) {
  const dispatch = useDispatch();
  const { isActioning, actionError, lastAction } = useSelector((s) => s.returns);

  const eligible =
    returnRequest && returnRequest.status === 'COMPLETADA' && returnRequest.payment;

  const [amount, setAmount]       = useState(() => initialAmount(returnRequest));
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    setAmount(initialAmount(returnRequest));
  }, [returnRequest?.id, returnRequest?.refund_amount_suggested]);

  if (!eligible) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setLocalError('El monto debe ser mayor a cero.');
      return;
    }
    setLocalError('');
    dispatch(processReturnRefund({
      id:     returnRequest.id,
      amount: numericAmount,
    }));
  };

  const payment = returnRequest.payment;

  return (
    <section className={styles.panel} aria-label="Procesar reembolso">
      <h2 className={styles.title}>Procesar reembolso</h2>

      <dl className={styles.summary}>
        <div className={styles.summaryRow}>
          <dt>Gateway original</dt>
          <dd>{payment.gateway}</dd>
        </div>
        <div className={styles.summaryRow}>
          <dt>Monto del pago</dt>
          <dd>${payment.amount}</dd>
        </div>
        <div className={styles.summaryRow}>
          <dt>Estado del pago</dt>
          <dd>{payment.status}</dd>
        </div>
      </dl>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="return-refund-amount">Monto a reembolsar</label>
          <input
            id="return-refund-amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          {localError && <span className={styles.error}>{localError}</span>}
        </div>

        {actionError && (
          <p role="alert" className={styles.error}>
            {typeof actionError === 'string'
              ? actionError
              : 'No se pudo procesar el reembolso. Intenta de nuevo.'}
          </p>
        )}

        <button
          type="submit"
          className={styles.primaryBtn}
          disabled={isActioning}
        >
          {isActioning ? 'Procesando…' : 'Confirmar reembolso'}
        </button>

        {lastAction === 'refunded' && (
          <p className={styles.success}>Reembolso enviado al gateway correctamente.</p>
        )}
      </form>
    </section>
  );
}
