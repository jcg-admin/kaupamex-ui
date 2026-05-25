/**
 * RegisterPage — Práctica Yorùbà
 * Crear cuenta · verifica email después.
 *
 * Endpoints:
 *   POST /auth/register/
 */

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '@redux/slices/authSlice';
import { Button, Field, MetaTag } from '@components/common/primitives';
import logoUrl from '@assets/practica-yoruba-logo.png';
import styles from '../auth/LoginPage.module.scss';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', username: '', password: '', terms: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!form.terms) {
      setErrors({ terms: 'Debes aceptar los términos.' });
      return;
    }
    setLoading(true);
    try {
      await dispatch(registerUser(form)).unwrap();
      navigate('/auth/verificar-correo', { state: { email: form.email } });
    } catch (err) {
      setErrors(err.fields || { _form: 'No se pudo crear la cuenta.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.heroCol}>
        <Link to="/" className={styles.heroBrand}>
          <img src={logoUrl} alt="" className={styles.heroLogo} />
          <div>
            <div className={styles.heroName}>Práctica Yorùbà</div>
            <div className={styles.heroTag}>Ifá · Òrìsà · Olódùmarè</div>
          </div>
        </Link>
        <div className={styles.heroBody}>
          <MetaTag tone="bronze">Para los que practican</MetaTag>
          <h1 className={styles.heroTitle}>Abre tu cuenta <em>en la casa</em>.</h1>
          <p className={styles.heroLead}>
            Te enviaremos un correo para verificar tu dirección. Sin compartir tus datos.
            Tu privacidad es nuestra responsabilidad.
          </p>
          <ul className={styles.perks}>
            <li className={styles.perk}><span className={styles.perkDot}>·</span>Acceso al calendario del santoral</li>
            <li className={styles.perk}><span className={styles.perkDot}>·</span>Lista de deseos persistente</li>
            <li className={styles.perk}><span className={styles.perkDot}>·</span>Checkout más rápido la próxima vez</li>
            <li className={styles.perk}><span className={styles.perkDot}>·</span>Historial de pedidos completo</li>
          </ul>
        </div>
        <div className={styles.heroFootnote}>Sin spam · puedes cancelar tu cuenta cuando quieras</div>
        <div className={styles.deco1} aria-hidden="true" />
        <div className={styles.deco2} aria-hidden="true" />
      </section>

      <section className={styles.formCol}>
        <div className={styles.formWrap}>
          <div className={styles.tabs}>
            <Link to="/auth/login" className={styles.tab}>Iniciar sesión</Link>
            <span className={`${styles.tab} ${styles.tabActive}`}>Crear cuenta</span>
          </div>

          <h2 className={styles.title}>Crear cuenta</h2>
          <p className={styles.lead}>
            Te enviaremos un correo para verificar tu dirección.
          </p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Nombre"   value={form.first_name} onChange={set('first_name')} error={errors.first_name} required autoComplete="given-name" />
              <Field label="Apellido" value={form.last_name}  onChange={set('last_name')}  error={errors.last_name}  required autoComplete="family-name" />
            </div>
            <Field label="Correo electrónico" type="email" value={form.email} onChange={set('email')} error={errors.email} required autoComplete="email" />
            <Field label="Nombre de usuario" value={form.username} onChange={set('username')} error={errors.username} required placeholder="manuel_ortega" autoComplete="username" />
            <Field
              label="Contraseña"
              type="password"
              value={form.password}
              onChange={set('password')}
              error={errors.password}
              required
              hint="· Mínimo 8 caracteres · No similar a tu usuario · No demasiado común"
              autoComplete="new-password"
            />

            <label className={styles.checkboxLabel} style={{ alignItems: 'flex-start', marginTop: 4 }}>
              <input
                type="checkbox"
                checked={form.terms}
                onChange={(e) => setForm({ ...form, terms: e.target.checked })}
              />
              <span className={styles.checkbox} style={{ marginTop: 2 }} />
              <span>
                Acepto los <Link to="/info/terminos">términos</Link> y el{' '}
                <Link to="/info/privacidad">aviso de privacidad</Link>.
              </span>
            </label>
            {errors.terms && <div style={{ color: 'var(--c-vino-soft)', fontSize: 12 }}>{errors.terms}</div>}
            {errors._form && <div style={{ color: 'var(--c-vino-soft)', fontSize: 13 }}>{errors._form}</div>}

            <Button type="submit" variant="primary" block size="lg" disabled={loading}>
              {loading ? 'Creando…' : 'Crear mi cuenta'}
            </Button>

            <div className={styles.footer}>
              ¿Ya tienes cuenta? <Link to="/auth/login">Inicia sesión →</Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
