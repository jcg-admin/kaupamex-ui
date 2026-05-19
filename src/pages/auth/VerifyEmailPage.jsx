/**
 * VerifyEmailPage — PracticaYoruba
 * UC-AUTH-10: Verifica el email del usuario tras registro.
 *
 * El correo enviado contiene un enlace a /auth/verify-email?token=...
 * La pagina lee el token del query string y dispara la verificacion.
 * Si el token es invalido o expiro, ofrece reenviar el correo.
 */
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import {
  verifyEmail,
  resendVerificationEmail,
} from '@redux/slices/authSlice';
import styles from './VerifyEmailPage.module.scss';

const STATUS = {
  IDLE:     'idle',
  PENDING:  'pending',
  SUCCESS:  'success',
  ERROR:    'error',
};

export default function VerifyEmailPage() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState(STATUS.IDLE);
  const [error, setError]   = useState(null);
  const [email, setEmail]   = useState('');
  const [resendStatus, setResendStatus] = useState(STATUS.IDLE);
  const [resendError, setResendError]   = useState(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setStatus(STATUS.PENDING);
    dispatch(verifyEmail(token)).then((result) => {
      if (cancelled) return;
      if (verifyEmail.fulfilled.match(result)) {
        setStatus(STATUS.SUCCESS);
      } else {
        setStatus(STATUS.ERROR);
        setError(result.payload);
      }
    });
    return () => { cancelled = true; };
  }, [dispatch, token]);

  const handleResend = async (ev) => {
    ev.preventDefault();
    if (!email.trim()) return;
    setResendStatus(STATUS.PENDING);
    const result = await dispatch(resendVerificationEmail(email.trim()));
    if (resendVerificationEmail.fulfilled.match(result)) {
      setResendStatus(STATUS.SUCCESS);
    } else {
      setResendStatus(STATUS.ERROR);
      setResendError(result.payload);
    }
  };

  if (!token) {
    return (
      <main className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Verificacion de email</h1>
          <p className={styles.error} role="alert">
            El enlace de verificacion incompleto. Vuelve a abrir el
            correo recibido tras tu registro.
          </p>
          <p className={styles.links}>
            <Link to="/auth/login">Volver al inicio de sesion</Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Verificacion de email</h1>

        {status === STATUS.PENDING && (
          <p className={styles.pending} aria-live="polite">
            Verificando tu cuenta...
          </p>
        )}

        {status === STATUS.SUCCESS && (
          <>
            <p className={styles.success} role="status">
              Email verificado correctamente. Tu cuenta esta activa.
            </p>
            <p className={styles.links}>
              <Link to="/auth/login">Iniciar sesion</Link>
            </p>
          </>
        )}

        {status === STATUS.ERROR && (
          <>
            <p className={styles.error} role="alert">
              El enlace de verificacion no es valido o expiro.
              {error?.message && (
                <span className={styles.detail}>{` (${error.message})`}</span>
              )}
            </p>

            {resendStatus === STATUS.SUCCESS ? (
              <p className={styles.success} role="status">
                Te enviamos un nuevo correo de verificacion.
              </p>
            ) : (
              <form onSubmit={handleResend} noValidate className={styles.form}>
                <div className={styles.field}>
                  <label htmlFor="email">Correo electronico</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {resendError && (
                  <p className={styles.error} role="alert">
                    {resendError.message || 'No se pudo reenviar el correo.'}
                  </p>
                )}
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={resendStatus === STATUS.PENDING}
                >
                  {resendStatus === STATUS.PENDING
                    ? 'Enviando...'
                    : 'Reenviar correo'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </main>
  );
}
