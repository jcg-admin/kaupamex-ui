/**
 * ChangePasswordPage — PracticaYoruba
 * UC-AUTH-08: Cambiar contrasena del comprador autenticado.
 *
 * Flujo:
 *   1. Captura contrasena actual + nueva + confirmacion.
 *   2. Valida fortaleza con usePasswordStrength.
 *   3. POST /api/v1/auth/change-password/ via authSlice.changePassword.
 *   4. Confirma exito e indica que sesiones en otros dispositivos
 *      quedaron invalidadas (POST-02).
 */
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { changePassword } from '@redux/slices/authSlice';
import { usePasswordStrength } from '@hooks/domain/usePasswordStrength';
import styles from './ChangePasswordPage.module.scss';

function fieldError(error, key) {
  return error?.validationErrors?.[key]?.[0];
}

export default function ChangePasswordPage() {
  const dispatch = useDispatch();
  const apiError = useSelector((s) => s.auth?.error);
  const isLoading = useSelector((s) => s.auth?.isLoading);

  const [fields, setFields] = useState({
    oldPassword: '', newPassword: '', confirmPassword: '',
  });
  const [errors, setErrors]   = useState({});
  const [success, setSuccess] = useState(false);

  const strength = usePasswordStrength(fields.newPassword);

  const validate = () => {
    const e = {};
    if (!fields.oldPassword)
      e.oldPassword = 'La contrasena actual es obligatoria.';
    if (!fields.newPassword)
      e.newPassword = 'La nueva contrasena es obligatoria.';
    else if (fields.newPassword.length < 8)
      e.newPassword = 'La contrasena debe tener al menos 8 caracteres.';
    else if (fields.newPassword === fields.oldPassword)
      e.newPassword = 'La nueva contrasena debe ser distinta a la actual.';

    if (fields.newPassword !== fields.confirmPassword)
      e.confirmPassword = 'Las contrasenas no coinciden.';

    return e;
  };

  const handleChange = (ev) => {
    setFields((p) => ({ ...p, [ev.target.name]: ev.target.value }));
    if (errors[ev.target.name]) {
      setErrors((p) => ({ ...p, [ev.target.name]: '' }));
    }
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setSuccess(false);
    const v = validate();
    if (Object.keys(v).length > 0) {
      setErrors(v);
      return;
    }
    const result = await dispatch(changePassword({
      currentPassword: fields.oldPassword,
      newPassword:     fields.newPassword,
      confirmPassword: fields.confirmPassword,
    }));
    if (changePassword.fulfilled.match(result)) {
      setSuccess(true);
      setFields({ oldPassword: '', newPassword: '', confirmPassword: '' });
    }
  };

  const apiMessage = (() => {
    if (!apiError) return null;
    if (apiError.code === 'INVALID_CURRENT_PASSWORD')
      return 'La contrasena actual es incorrecta.';
    if (apiError.code === 'PASSWORD_TOO_WEAK')
      return 'La nueva contrasena no cumple los requisitos de seguridad.';
    if (apiError.code === 'PASSWORD_REPEAT')
      return 'La nueva contrasena debe ser distinta a la actual.';
    return (
      apiError?.body?.detail
      || apiError?.message
      || 'No se pudo actualizar la contrasena.'
    );
  })();

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Cambiar contrasena</h1>
        <p className={styles.subtitle}>
          Tu contrasena protege tu cuenta. Elige una nueva de al menos 8
          caracteres.
        </p>

        {success && (
          <p className={styles.success} role="status">
            Contrasena cambiada exitosamente. Las sesiones en otros
            dispositivos han sido cerradas.
          </p>
        )}

        {apiMessage && !success && (
          <p className={styles.error} role="alert">
            {apiMessage}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="old-password">Contrasena actual</label>
            <input
              id="old-password"
              type="password"
              name="oldPassword"
              autoComplete="current-password"
              value={fields.oldPassword}
              onChange={handleChange}
              aria-invalid={!!errors.oldPassword}
            />
            {(errors.oldPassword || fieldError(apiError, 'current_password')) && (
              <span className={styles.fieldError}>
                {errors.oldPassword || fieldError(apiError, 'current_password')}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="new-password">Nueva contrasena</label>
            <input
              id="new-password"
              type="password"
              name="newPassword"
              autoComplete="new-password"
              value={fields.newPassword}
              onChange={handleChange}
              aria-invalid={!!errors.newPassword}
            />
            {fields.newPassword && (
              <p
                className={styles.strength}
                style={{ color: strength.color }}
                aria-live="polite"
              >
                Fortaleza: {strength.label || 'Muy debil'}
              </p>
            )}
            {(errors.newPassword || fieldError(apiError, 'new_password')) && (
              <span className={styles.fieldError}>
                {errors.newPassword || fieldError(apiError, 'new_password')}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="confirm-password">Confirmar nueva contrasena</label>
            <input
              id="confirm-password"
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              value={fields.confirmPassword}
              onChange={handleChange}
              aria-invalid={!!errors.confirmPassword}
            />
            {errors.confirmPassword && (
              <span className={styles.fieldError}>
                {errors.confirmPassword}
              </span>
            )}
          </div>

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : 'Guardar cambio'}
            </button>
            <Link to="/account" className={styles.cancelLink}>
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
