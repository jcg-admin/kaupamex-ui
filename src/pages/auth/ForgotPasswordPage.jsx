/**
 * ForgotPasswordPage — Práctica Yorùbà
 * Solicitar email de recuperación.
 *
 * Endpoints:
 *   POST /auth/password-reset/
 */

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '@redux/slices/authSlice';
import { Button, Field, MetaTag } from '@components/common/primitives';
import logoUrl from '@assets/practica-yoruba-logo.png';
import styles from './AuthSimplePage.module.scss';

export default function ForgotPasswordPage() {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dispatch(requestPasswordReset({ email })).unwrap();
      setSent(true);
    } catch (err) {
      // El backend devuelve siempre 200 por seguridad (anti-enumeración).
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link to="/" className={styles.brand}>
          <img src={logoUrl} alt="" className={styles.brandLogo} />
          <div>
            <div className={styles.brandName}>Práctica Yorùbà</div>
            <div className={styles.brandTag}>Ifá · Òrìsà · Olódùmarè</div>
          </div>
        </Link>

        <div className={styles.steps}>
          <div className={`${styles.step} ${styles.stepActive}`} />
          <div className={styles.step} />
        </div>

        {!sent ? (
          <>
            <MetaTag tone="bronze">Paso 1 de 2</MetaTag>
            <h1 className={styles.title}>Recuperar tu contraseña</h1>
            <p className={styles.lead}>
              Escribe el correo con el que abriste tu cuenta. Te enviaremos un enlace
              para restablecer la contraseña.
            </p>

            <form className={styles.form} onSubmit={handleSubmit}>
              <Field
                label="Correo electrónico"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" variant="primary" block size="lg" disabled={loading}>
                {loading ? 'Enviando…' : 'Enviar enlace de recuperación'}
              </Button>
            </form>
          </>
        ) : (
          <>
            <div className={styles.envelope}>✉</div>
            <MetaTag tone="bronze">Casi listo</MetaTag>
            <h1 className={styles.title}>Revisa tu correo</h1>
            <p className={styles.lead}>
              Si la dirección está registrada, te enviamos un enlace a{' '}
              <strong>{email}</strong>. El enlace es válido por <strong>1 hora</strong>{' '}
              y se invalida al usarlo.
            </p>
            <div className={styles.note}>
              ¿No encuentras el correo? Revisa tu bandeja de spam.
            </div>
          </>
        )}

        <div className={styles.footer}>
          ¿Recuerdas tu contraseña? <Link to="/auth/login">Iniciar sesión →</Link>
        </div>
      </div>
    </main>
  );
}
