/**
 * ResetPasswordPage — Práctica Yorùbà
 * Confirmar nueva contraseña con el token del enlace.
 *
 * Endpoints:
 *   POST /auth/password-reset/confirm/
 */

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { confirmPasswordReset } from '@redux/slices/authSlice';
import { Button, MetaTag } from '@components/common/primitives';
import { PasswordInput } from '@components/common';
import logoUrl from '@assets/practica-yoruba-logo.png';
import styles from './AuthSimplePage.module.scss';

export default function ResetPasswordPage() {
  // El enlace del email es /auth/reset-password/?token=XXX (query param),
  // no /reset-password/:uid/:token. El endpoint de confirmacion solo usa
  // `token`. Leer el token del query, igual que VerifyEmailPage.
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [pwd, setPwd] = useState({ next: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (pwd.next !== pwd.confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (!token) {
      setError('Enlace inválido: falta el token. Solicita uno nuevo.');
      return;
    }
    setLoading(true);
    try {
      await dispatch(confirmPasswordReset({
        token,
        new_password: pwd.next,
        new_password_confirm: pwd.confirm,
      })).unwrap();
      navigate('/auth/login?reset=ok', { replace: true });
    } catch (err) {
      setError(err.message || 'Token inválido o expirado. Solicita un enlace nuevo.');
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
          <div className={`${styles.step} ${styles.stepActive}`} />
        </div>

        <MetaTag tone="bronze">Paso 2 de 2</MetaTag>
        <h1 className={styles.title}>Nueva contraseña</h1>
        <p className={styles.lead}>
          El enlace es válido por <strong>1 hora</strong> y se invalida al usarlo.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <PasswordInput
            label="Nueva contraseña"
            value={pwd.next}
            onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
            placeholder="mínimo 8 caracteres"
            autoComplete="new-password"
          />
          <PasswordInput
            label="Confirmar contraseña"
            value={pwd.confirm}
            onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
            error={error}
            autoComplete="new-password"
          />
          <div style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--c-ink-mute)', lineHeight: 1.85 }}>
            · Mínimo 8 caracteres &nbsp;
            · No similar a tu correo &nbsp;
            · Distinta a las últimas 3
          </div>
          <Button type="submit" variant="primary" block size="lg" disabled={loading}>
            {loading ? 'Cambiando…' : 'Cambiar contraseña'}
          </Button>
        </form>

        <div className={styles.footer}>
          ¿Necesitas otro enlace? <Link to="/auth/forgot-password">Volver al paso 1</Link>
        </div>
      </div>
    </main>
  );
}
