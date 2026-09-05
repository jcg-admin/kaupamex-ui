/**
 * DeactivateAccountPage — Kaupamex
 * UC-AUTH-16: Dar de Baja la Propia Cuenta.
 *
 * Flujo:
 *   1. Muestra advertencia explicita: baja logica + posibilidad de
 *      reactivar via UC-AUTH-01 Alt-A.2 (re-registro).
 *   2. Pide password actual + confirmacion explicita (checkbox).
 *   3. POST /api/v2/auth/me/deactivate/ via authSlice.deactivateAccount.
 *   4. En exito: limpia estado de auth, redirige al home, muestra toast.
 *   5. En error de password: muestra error inline sin limpiar campo.
 */
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { deactivateAccount } from '@redux/slices/authSlice';
import { PasswordInput } from '@components/common';
import styles from './DeactivateAccountPage.module.scss';

export default function DeactivateAccountPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const apiError = useSelector((s) => s.auth?.error);
  const isLoading = useSelector((s) => s.auth?.isLoading);

  const [password, setPassword]     = useState('');
  const [confirmed, setConfirmed]   = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setLocalError('');

    if (!password) {
      setLocalError('Debes ingresar tu contrasena actual para confirmar.');
      return;
    }
    if (!confirmed) {
      setLocalError('Debes marcar la confirmacion para continuar.');
      return;
    }

    const result = await dispatch(deactivateAccount({ password }));
    if (deactivateAccount.fulfilled.match(result)) {
      // El reducer ya limpio el estado de auth.
      navigate('/', {
        replace: true,
        state: { toast: 'Tu cuenta ha sido dada de baja.' },
      });
    }
  };

  const apiMessage = (() => {
    if (!apiError) return null;
    if (apiError?.body?.detail === 'Contrasena incorrecta.') {
      return 'La contrasena ingresada no es correcta.';
    }
    return (
      apiError?.body?.detail
      || apiError?.message
      || 'No se pudo procesar la baja. Intenta de nuevo.'
    );
  })();

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Dar de baja mi cuenta</h1>

        <div className={styles.warning} role="alert">
          <p>
            Esta accion deja tu cuenta inactiva y cierra todas tus sesiones.
            <strong> No se eliminan tus pedidos, pagos ni historial</strong>{' '}
            — se conservan por requisitos fiscales y para que puedas reactivar
            tu cuenta mas adelante si lo deseas.
          </p>
          <p>
            Si decides volver, puedes registrarte nuevamente con el mismo
            email y te enviaremos un enlace de reactivacion (UC-AUTH-01).
          </p>
        </div>

        {apiMessage && (
          <p className={styles.error} role="alert">
            {apiMessage}
          </p>
        )}
        {localError && (
          <p className={styles.error} role="alert">
            {localError}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          <div className={styles.field}>
            <PasswordInput
              id="deactivate-password"
              label="Contrasena actual"
              autoComplete="current-password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              disabled={isLoading}
            />
          </div>

          <label className={styles.confirm}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(ev) => setConfirmed(ev.target.checked)}
              disabled={isLoading}
            />
            <span>
              Entiendo que mi cuenta quedara inactiva y se cerraran mis
              sesiones actuales.
            </span>
          </label>

          <div className={styles.actions}>
            <Link to="/account" className={styles.cancel}>
              Cancelar
            </Link>
            <button
              type="submit"
              className={styles.submit}
              disabled={isLoading || !confirmed || !password}
            >
              {isLoading ? 'Procesando...' : 'Dar de baja mi cuenta'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
