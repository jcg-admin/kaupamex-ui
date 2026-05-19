/**
 * NewsletterUnsubscribePage — PracticaYoruba
 * UC-NEW-02: desuscripcion publica del newsletter via token firmado.
 */
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  unsubscribeNewsletter,
  clearNewsletterActionState,
} from '@redux/slices/newsletterSlice';
import styles from './NewsletterUnsubscribePage.module.scss';

const REASONS = [
  { value: '',             label: 'No quiero indicar el motivo' },
  { value: 'TOO_FREQUENT', label: 'Recibo demasiados emails' },
  { value: 'NOT_RELEVANT', label: 'El contenido no es relevante' },
  { value: 'NEVER_SUBSCRIBED', label: 'Nunca me suscribi' },
  { value: 'OTHER',        label: 'Otro motivo' },
];

export default function NewsletterUnsubscribePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const dispatch = useDispatch();
  const { isActioning, actionError, lastAction } =
    useSelector((s) => s.newsletter);
  const [reason, setReason] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!token) return;
    dispatch(clearNewsletterActionState());
    dispatch(unsubscribeNewsletter({ token, reason: reason || null }));
  };

  if (!token) {
    return (
      <section className={styles.page}>
        <h1 className={styles.title}>Desuscribirte del newsletter</h1>
        <p role="alert" className={styles.error}>
          Enlace de desuscripcion no valido. Vuelve a tu email y abre el
          enlace original.
        </p>
      </section>
    );
  }

  if (lastAction === 'unsubscribed') {
    return (
      <section className={styles.page} aria-labelledby="unsub-success-title">
        <h1 id="unsub-success-title" className={styles.title}>
          Te has desuscrito correctamente
        </h1>
        <p className={styles.successMessage}>
          No volveremos a enviarte emails del boletin. Si fue accidental,
          puedes volver a suscribirte en cualquier momento.
        </p>
      </section>
    );
  }

  return (
    <section className={styles.page} aria-labelledby="unsub-title">
      <header className={styles.header}>
        <h1 id="unsub-title" className={styles.title}>
          Desuscribirte del newsletter
        </h1>
        <p className={styles.description}>
          Confirma que quieres dejar de recibir el boletin. Si quieres,
          cuentanos por que.
        </p>
      </header>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="unsub-reason">Motivo (opcional)</label>
          <select
            id="unsub-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {actionError && (
          <p role="alert" className={styles.error}>
            {actionError.message || 'No se pudo completar la desuscripcion.'}
          </p>
        )}

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={isActioning}
          >
            {isActioning ? 'Procesando…' : 'Confirmar desuscripcion'}
          </button>
        </div>
      </form>
    </section>
  );
}
