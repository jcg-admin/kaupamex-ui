/**
 * RegisterPage — PracticaYoruba
 * Registro de comprador (UC-AUTH-01).
 *
 * Sprint 1 (completado en Sprint 2):
 *   - Con PY_AUTH_SOURCE=mock simula el registro y muestra confirmacion.
 *   - Con PY_AUTH_SOURCE=real llama a POST /api/v1/auth/register/.
 */

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { registerUser } from '@redux/slices/authSlice';
import { selectAuthLoading, selectAuthError } from '@redux/selectors';
import styles from './RegisterPage.module.scss';

const USE_MOCK = process.env.PY_AUTH_SOURCE === 'mock';

export default function RegisterPage() {
  const dispatch  = useDispatch();
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);

  const [fields, setFields]    = useState({
    username: '', email: '', password: '', password_confirm: '',
  });
  const [errors, setErrors]    = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const e = {};
    if (fields.username.trim().length < 3)
      e.username = 'El usuario debe tener al menos 3 caracteres.';
    if (!fields.email.includes('@'))
      e.email = 'Ingresa un email valido.';
    if (fields.password.length < 8)
      e.password = 'La contrasena debe tener al menos 8 caracteres.';
    if (fields.password !== fields.password_confirm)
      e.password_confirm = 'Las contrasenas no coinciden.';
    return e;
  };

  const handleChange = (e) => {
    setFields(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length) { setErrors(validation); return; }

    if (USE_MOCK) {
      setSubmitted(true);
      return;
    }

    const result = await dispatch(registerUser(fields));
    if (registerUser.fulfilled.match(result)) setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Revisa tu email</h1>
          <p>
            Enviamos un enlace de activacion a <strong>{fields.email || 'tu correo'}</strong>.
            Activa tu cuenta para iniciar sesion.
          </p>
          <Link to="/auth/login" className={styles.submitButton}>
            Ir al inicio de sesion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Crear cuenta</h1>
        <p className={styles.subtitle}>
          Crea tu cuenta en PracticaYoruba
        </p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <label htmlFor="username">Nombre de usuario</label>
            <input
              id="username" name="username" type="text"
              autoComplete="username"
              value={fields.username} onChange={handleChange}
              aria-invalid={!!errors.username}
            />
            {errors.username && <span className={styles.error}>{errors.username}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email" name="email" type="email"
              autoComplete="email"
              value={fields.email} onChange={handleChange}
              aria-invalid={!!errors.email}
            />
            {errors.email && <span className={styles.error}>{errors.email}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Contrasena</label>
            <input
              id="password" name="password" type="password"
              autoComplete="new-password"
              value={fields.password} onChange={handleChange}
              aria-invalid={!!errors.password}
            />
            {errors.password && <span className={styles.error}>{errors.password}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="password_confirm">Confirmar contrasena</label>
            <input
              id="password_confirm" name="password_confirm" type="password"
              autoComplete="new-password"
              value={fields.password_confirm} onChange={handleChange}
              aria-invalid={!!errors.password_confirm}
            />
            {errors.password_confirm && (
              <span className={styles.error}>{errors.password_confirm}</span>
            )}
          </div>

          {authError && !USE_MOCK && (
            <p className={styles.globalError} role="alert">{authError}</p>
          )}

          <button type="submit" className={styles.submitButton} disabled={isLoading}>
            {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className={styles.links}>
          <Link to="/auth/login">Ya tengo cuenta</Link>
        </p>

        {USE_MOCK && (
          <p className={styles.mockBadge}>Modo mock activo</p>
        )}
      </div>
    </div>
  );
}
