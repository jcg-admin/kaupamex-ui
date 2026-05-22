/**
 * RegisterPage — PracticaYoruba
 * Registro de comprador (UC-AUTH-01).
 *
 * D-07: campos first_name, last_name (opcionales), email, password,
 *       password_confirm, terms_accepted. Sin campo username (auto-generado en API).
 *
 * Con PY_AUTH_SOURCE=mock simula el registro y muestra confirmacion.
 * Con PY_AUTH_SOURCE=real llama a POST /api/v1/auth/register/.
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

  const [fields, setFields] = useState({
    first_name: '', last_name: '', email: '',
    password: '', password_confirm: '', terms_accepted: false,
  });
  const [errors, setErrors]       = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const e = {};
    if (!fields.email.includes('@'))
      e.email = 'Ingresa un email valido.';
    if (fields.password.length < 8)
      e.password = 'La contrasena debe tener al menos 8 caracteres.';
    if (fields.password !== fields.password_confirm)
      e.password_confirm = 'Las contrasenas no coinciden.';
    if (!fields.terms_accepted)
      e.terms_accepted = 'Debes aceptar los terminos y condiciones.';
    return e;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFields(prev => ({ ...prev, [name]: newValue }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
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
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="first_name">Nombre</label>
              <input
                id="first_name" name="first_name" type="text"
                autoComplete="given-name"
                value={fields.first_name} onChange={handleChange}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="last_name">Apellido</label>
              <input
                id="last_name" name="last_name" type="text"
                autoComplete="family-name"
                value={fields.last_name} onChange={handleChange}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="email">Email <span className={styles.required}>*</span></label>
            <input
              id="email" name="email" type="email"
              autoComplete="email"
              value={fields.email} onChange={handleChange}
              aria-invalid={!!errors.email}
              required
            />
            {errors.email && <span className={styles.error}>{errors.email}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Contrasena <span className={styles.required}>*</span></label>
            <input
              id="password" name="password" type="password"
              autoComplete="new-password"
              value={fields.password} onChange={handleChange}
              aria-invalid={!!errors.password}
              required
            />
            {errors.password && <span className={styles.error}>{errors.password}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="password_confirm">Confirmar contrasena <span className={styles.required}>*</span></label>
            <input
              id="password_confirm" name="password_confirm" type="password"
              autoComplete="new-password"
              value={fields.password_confirm} onChange={handleChange}
              aria-invalid={!!errors.password_confirm}
              required
            />
            {errors.password_confirm && (
              <span className={styles.error}>{errors.password_confirm}</span>
            )}
          </div>

          <div className={styles.fieldCheckbox}>
            <input
              id="terms_accepted" name="terms_accepted" type="checkbox"
              checked={fields.terms_accepted} onChange={handleChange}
              aria-invalid={!!errors.terms_accepted}
            />
            <label htmlFor="terms_accepted">
              Acepto los{' '}
              <Link to="/terminos" target="_blank" rel="noopener noreferrer">
                terminos de uso
              </Link>{' '}
              y la{' '}
              <Link to="/privacidad" target="_blank" rel="noopener noreferrer">
                politica de privacidad
              </Link>
              {' '}<span className={styles.required}>*</span>
            </label>
            {errors.terms_accepted && (
              <span className={styles.error}>{errors.terms_accepted}</span>
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
