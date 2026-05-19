/**
 * NewsletterSubscribePage — PracticaYoruba
 * UC-NEW-01: suscripcion publica al newsletter (doble optin).
 */
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  subscribeNewsletter,
  clearNewsletterActionState,
} from '@redux/slices/newsletterSlice';
import styles from './NewsletterSubscribePage.module.scss';

function isValidEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

export default function NewsletterSubscribePage() {
  const dispatch = useDispatch();
  const { isActioning, actionError, lastAction } =
    useSelector((s) => s.newsletter);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!email.trim()) {
      setError('El email es obligatorio.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('El email no tiene un formato valido.');
      return;
    }
    setError('');
    dispatch(clearNewsletterActionState());
    dispatch(subscribeNewsletter({ email: email.trim(), source: 'page' }));
  };

  const handleAnother = () => {
    setEmail('');
    setError('');
    dispatch(clearNewsletterActionState());
  };

  if (lastAction === 'subscribed') {
    return (
      <section className={styles.page} aria-labelledby="newsletter-success-title">
        <h1 id="newsletter-success-title" className={styles.title}>
          Casi listo
        </h1>
        <p className={styles.successMessage}>
          Revisa tu email para confirmar la suscripcion (doble optin).
          Una vez confirmado empezaras a recibir el boletin.
        </p>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={handleAnother}
        >
          Suscribir otro email
        </button>
      </section>
    );
  }

  return (
    <section className={styles.page} aria-labelledby="newsletter-title">
      <header className={styles.header}>
        <h1 id="newsletter-title" className={styles.title}>
          Suscribete al newsletter
        </h1>
        <p className={styles.description}>
          Recibe novedades, promociones y contenido del dominio Yoruba.
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="newsletter-email">Email</label>
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(error)}
          />
          {error && <span className={styles.fieldError}>{error}</span>}
        </div>

        {actionError && (
          <p role="alert" className={styles.error}>
            {actionError.message || 'No se pudo procesar la suscripcion.'}
          </p>
        )}

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={isActioning}
          >
            {isActioning ? 'Enviando…' : 'Suscribirme'}
          </button>
        </div>
      </form>
    </section>
  );
}
