/**
 * VerifyEmailPage — Kaupamex
 * UC-AUTH-10: Verifica el email del usuario tras registro.
 *
 * El correo enviado contiene un enlace a /auth/verify-email?token=...
 * La pagina lee el token del query string y dispara la verificacion.
 * Si el token es invalido o expiro, ofrece reenviar el correo.
 */
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const location = useLocation();
  const pendingEmail = location.state?.email;
  // DEC-STF-AUTH-NEXT: el link de verificacion puede traer &next=/ruta. Tras la
  // verificacion el backend deja al usuario logueado (auto-login por sesion,
  // ADR-018), asi que se redirige directo a ese destino. Guard anti
  // open-redirect: solo rutas internas ('/...' sin '//').
  const nextParam = searchParams.get('next');
  const safeNext =
    nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')
      ? nextParam
      : '/account';
  const loginHref = nextParam
    ? `/auth/login?next=${encodeURIComponent(nextParam)}`
    : '/auth/login';

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
        // Auto-login (ADR-018): el backend dejo la sesion establecida; llevar al
        // usuario directo a donde iba (next) o a su cuenta, sin re-loguearse.
        navigate(safeNext, { replace: true });
      } else {
        setStatus(STATUS.ERROR);
        setError(result.payload);
      }
    });
    return () => { cancelled = true; };
  }, [dispatch, token, navigate, safeNext]);

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
          <h1 className={styles.title}>Revisa tu correo</h1>
          <p className={styles.pending} role="status">
            {pendingEmail
              ? `Te enviamos un correo de verificación a ${pendingEmail}. `
              : 'Te enviamos un correo de verificación. '}
            Abre el enlace que incluye para activar tu cuenta.
          </p>
          <p className={styles.hint}>
            ¿No lo ves en unos minutos? Revisa tu carpeta de spam o
            correo no deseado, y agrega noreply@kaupamex.com a tus
            contactos para futuros envíos.
          </p>
          <p className={styles.links}>
            <Link to={loginHref}>Volver al inicio de sesión</Link>
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
            <p className={styles.pending} aria-live="polite">
              Te estamos llevando a tu cuenta...
            </p>
          </>
        )}

        {status === STATUS.ERROR && error?.code === 'TOKEN_ALREADY_USED' && (
          <>
            <p className={styles.success} role="status">
              Este enlace ya fue utilizado. Si tu cuenta ya esta activa, inicia sesion.
            </p>
            <p className={styles.links}>
              <Link to={loginHref}>Ir a iniciar sesion</Link>
            </p>
          </>
        )}

        {status === STATUS.ERROR && error?.code !== 'TOKEN_ALREADY_USED' && (
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
