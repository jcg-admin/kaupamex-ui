/**
 * LoginPage — Práctica Yorùbà
 * Layout dividido editorial 50/50 con tabs Iniciar sesión / Crear cuenta.
 *
 * Endpoints:
 *   POST /auth/login/
 */

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '@redux/slices/authSlice';
import { Button, Field, MetaTag } from '@components/common/primitives';
import { PasswordInput } from '@components/common';
import logoUrl from '@assets/practica-yoruba-logo.png';
import styles from './LoginPage.module.scss';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/account';

  const [creds, setCreds] = useState({ email: '', password: '', remember: true });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await dispatch(loginUser({ username: creds.email, password: creds.password })).unwrap();
      navigate(redirectTo, { replace: true });
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
            <Link to="/auth/register" className={styles.tab}>Crear cuenta</Link>
          </div>

          <h2 className={styles.title}>Bienvenido de vuelta</h2>
          <p className={styles.lead}>
            Usa el correo y contraseña con los que abriste tu cuenta.
          </p>

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
              <Link to="/auth/register">Crear una ahora →</Link>
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
