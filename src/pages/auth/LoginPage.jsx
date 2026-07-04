/**
 * LoginPage — Práctica Yorùbà
 * Layout dividido editorial 50/50 con tabs Iniciar sesión / Crear cuenta.
 *
 * Endpoints:
 *   POST /auth/login/
 */

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { loginUser } from '@redux/slices/authSlice';
import { Button, Field, MetaTag } from '@components/common/primitives';
import { PasswordInput } from '@components/common';
import { safeNext, fromLocation } from '@utils/safeNext';
import logoUrl from '@assets/practica-yoruba-logo.png';
import styles from './LoginPage.module.scss';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  // Destino post-login (DEC-STF-AUTH-NEXT + T-04): el ?next= de la URL gana
  // (sobrevive el round-trip de verificacion por email); si no, el state.from
  // (navegacion en la misma pestana). Ambos pasan por el guard safeNext. Si no
  // hay ninguno, se regresa a la pagina anterior (historial), no a /account.
  const from = location.state?.from;
  const nextValue = safeNext(searchParams.get('next')) || safeNext(fromLocation(from));
  // El reset de contraseña redirige a /auth/login?reset=ok. Se usa para (1)
  // confirmar visualmente el éxito y (2) NO hacer navigate(-1) tras el login
  // —el "atrás" del historial es /auth/reset-password → /auth/forgot-password,
  // así que el usuario quedaba "expulsado" al flujo de recuperación.
  const resetOk = searchParams.get('reset') === 'ok';
  // Acarrea el destino al tab "Crear cuenta" para que el flujo de registro +
  // verificacion por email lo conserve (DEC-STF-AUTH-NEXT).
  const registerHref = nextValue
    ? `/auth/register?next=${encodeURIComponent(nextValue)}`
    : '/auth/register';

  const [creds, setCreds] = useState({ email: '', password: '', remember: true });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await dispatch(loginUser({ username: creds.email, password: creds.password })).unwrap();
      // T-04: destino explicito (?next= o state.from) si existe; si no,
      // regresar a la pagina anterior (historial); fallback a la home cuando
      // no hay historial de app (pestana nueva / primera carga).
      // EXCEPCION reset: tras cambiar la contraseña, el "atras" del historial
      // es el flujo de recuperacion; se va a /account, no navigate(-1).
      if (nextValue) navigate(nextValue, { replace: true });
      else if (resetOk) navigate('/account', { replace: true });
      else if (window.history.length > 1) navigate(-1);
      else navigate('/', { replace: true });
    } catch (err) {
      setError('Correo o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <SplitHero />
      <section className={styles.formCol}>
        <div className={styles.formWrap}>
          <div className={styles.tabs}>
            <span className={`${styles.tab} ${styles.tabActive}`}>Iniciar sesión</span>
            <Link to={registerHref} className={styles.tab}>Crear cuenta</Link>
          </div>

          <h2 className={styles.title}>Bienvenido de vuelta</h2>
          <p className={styles.lead}>
            Usa el correo y contraseña con los que abriste tu cuenta.
          </p>

          {resetOk && (
            <p role="status" className={styles.resetNotice} data-testid="login-reset-ok">
              Tu contraseña se actualizó. Inicia sesión con la nueva.
            </p>
          )}

          <form className={styles.form} onSubmit={handleSubmit}>
            <Field
              label="Correo electrónico"
              type="email"
              value={creds.email}
              onChange={(e) => setCreds({ ...creds, email: e.target.value })}
              required
              autoComplete="email"
              data-testid="login-email"
            />
            <div className={styles.passwordField}>
              <PasswordInput
                label="Contraseña"
                value={creds.password}
                onChange={(e) => setCreds({ ...creds, password: e.target.value })}
                error={error}
                autoComplete="current-password"
                data-testid="login-password"
              />
              <Link to="/auth/forgot-password" className={styles.forgotLink}>
                ¿OLVIDASTE TU CONTRASEÑA?
              </Link>
            </div>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={creds.remember}
                onChange={(e) => setCreds({ ...creds, remember: e.target.checked })}
              />
              <span className={styles.checkbox} />
              <span>Mantener mi sesión iniciada</span>
            </label>

            <Button type="submit" variant="primary" block size="lg" disabled={loading} data-testid="login-submit">
              {loading ? 'Entrando…' : 'Entrar a mi cuenta'}
            </Button>

            <div className={styles.footer}>
              ¿Aún no tienes cuenta?{' '}
              <Link to={registerHref}>Crear una ahora →</Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

function SplitHero() {
  return (
    <section className={styles.heroCol}>
      <Link to="/" className={styles.heroBrand}>
        <img src={logoUrl} alt="" className={styles.heroLogo} />
        <div>
          <div className={styles.heroName}>Práctica Yorùbà</div>
          <div className={styles.heroTag}>Ifá · Òrìsà · Olódùmarè</div>
        </div>
      </Link>

      <div className={styles.heroBody}>
        <MetaTag tone="bronze">Religión Yorùbà · México</MetaTag>
        <h1 className={styles.heroTitle}>
          Tu cuenta para <em>la práctica</em>.
        </h1>
        <p className={styles.heroLead}>
          Una cuenta te permite guardar direcciones, ver el historial de tus pedidos,
          recibir el calendario mensual del santoral Yorùbà y acceder a tu lista de deseos.
        </p>
        <ul className={styles.perks}>
          <Perk>Historial completo de tus pedidos</Perk>
          <Perk>Lista de deseos con aviso de cambios de precio</Perk>
          <Perk>Calendario mensual del santoral Yorùbà</Perk>
          <Perk>Direcciones guardadas para checkout rápido</Perk>
        </ul>
      </div>

      <div className={styles.heroFootnote}>Envíos a toda la república mexicana</div>

      <div className={styles.deco1} aria-hidden="true" />
      <div className={styles.deco2} aria-hidden="true" />
    </section>
  );
}

function Perk({ children }) {
  return (
    <li className={styles.perk}>
      <span className={styles.perkDot}>·</span>
      {children}
    </li>
  );
}
