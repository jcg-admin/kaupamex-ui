/**
 * ResetPasswordPage — PracticaYoruba
 * Restablecer contrasena con token del email (UC-AUTH-09 Fase 2).
 */

import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import styles from './ResetPasswordPage.module.scss';

const API_URL = '/api/v1/auth/password-reset/confirm/';
const USE_MOCK = process.env.PY_AUTH_SOURCE === 'mock';

export default function ResetPasswordPage() {
  const [searchParams]            = useSearchParams();
  const navigate                  = useNavigate();
  const token                     = searchParams.get('token') || '';
  const [fields, setFields]       = useState({ new_password: '', new_password_confirm: '' });
  const [errors, setErrors]       = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobal]  = useState('');

  const validate = () => {
    const e = {};
    if (fields.new_password.length < 8) e.new_password = 'Minimo 8 caracteres.';
    if (fields.new_password !== fields.new_password_confirm)
      e.new_password_confirm = 'Las contrasenas no coinciden.';
    return e;
  };

  const handleChange = (e) => {
    setFields(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    if (!token) { setGlobal('El enlace es invalido o ha expirado.'); return; }
    setIsLoading(true);
    setGlobal('');

    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 600));
      navigate('/auth/login', { state: { message: 'Contrasena restablecida. Inicia sesion.' } });
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...fields }),
      });
      if (res.ok) {
        navigate('/auth/login', { state: { message: 'Contrasena restablecida. Inicia sesion.' } });
      } else {
        const data = await res.json();
        setGlobal(data.token || data.detail || 'El enlace es invalido o ha expirado.');
      }
    } catch {
      setGlobal('Error de red. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Enlace invalido</h1>
          <p>Este enlace de recuperacion no es valido o ha expirado.</p>
          <Link to="/auth/forgot-password" className={styles.backLink}>
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Nueva contrasena</h1>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <label htmlFor="new_password">Nueva contrasena</label>
            <input
              id="new_password" name="new_password" type="password"
              autoComplete="new-password"
              value={fields.new_password} onChange={handleChange}
              aria-invalid={!!errors.new_password}
            />
            {errors.new_password && <span className={styles.error}>{errors.new_password}</span>}
          </div>
          <div className={styles.field}>
            <label htmlFor="new_password_confirm">Confirmar contrasena</label>
            <input
              id="new_password_confirm" name="new_password_confirm" type="password"
              autoComplete="new-password"
              value={fields.new_password_confirm} onChange={handleChange}
              aria-invalid={!!errors.new_password_confirm}
            />
            {errors.new_password_confirm && (
              <span className={styles.error}>{errors.new_password_confirm}</span>
            )}
          </div>

          {globalError && <p className={styles.globalError} role="alert">{globalError}</p>}

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? 'Guardando...' : 'Establecer nueva contrasena'}
          </button>
        </form>
      </div>
    </div>
  );
}
