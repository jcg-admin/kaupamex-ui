/**
 * RegisterPage — Práctica Yorùbà
 * Crear cuenta · verifica email después.
 *
 * Endpoints:
 *   POST /auth/register/
 */

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { registerUser } from '@redux/slices/authSlice';
import { Button, Field, MetaTag } from '@components/common/primitives';
import { PasswordInput } from '@components/common';
import { safeNext } from '@utils/safeNext';
import logoUrl from '@assets/practica-yoruba-logo.png';
import styles from '../auth/LoginPage.module.scss';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // DEC-STF-AUTH-NEXT: el destino post-auth viaja por ?next= (guardado). Se
  // envia al API para que el link de verificacion del email lo incluya, y se
  // acarrea al link de "Iniciar sesion".
  const nextParam = safeNext(searchParams.get('next'));
  const loginHref = nextParam
    ? `/auth/login?next=${encodeURIComponent(nextParam)}`
    : '/auth/login';
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '', password_confirm: '', terms: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (form.password !== form.password_confirm) {
      setErrors({ password_confirm: 'Las contraseñas no coinciden.' });
      return;
    }
    if (!form.terms) {
      setErrors({ terms: 'Debes aceptar los términos.' });
      return;
    }
    setLoading(true);
    try {
      await dispatch(registerUser({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
        password_confirm: form.password_confirm,
        terms_accepted: form.terms,
        ...(nextParam ? { next: nextParam } : {}),
      })).unwrap();
      navigate(
        nextParam ? `/auth/verify-email?next=${encodeURIComponent(nextParam)}` : '/auth/verify-email',
        { state: { email: form.email } },
      );
    } catch (err) {
      // Surfacar los field-errors del API (incl. el 409 "email ya
      // registrado", que trae {email:[...]} con sugerencia de login /
      // recuperar contrasena). Mapear claves del API a las del form.
      const raw = err.fields || err.validationErrors || {};
      const mapped = {};
      for (const [k, v] of Object.entries(raw)) {
        const key = k === 'terms_accepted' ? 'terms'
          : (k === 'non_field_errors' || k === 'detail') ? '_form' : k;
        mapped[key] = Array.isArray(v) ? v.join(' ') : v;
      }
      setErrors(
        Object.keys(mapped).length
          ? mapped
          : { _form: err.message || 'No se pudo crear la cuenta.' },
      );
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
            <Link to={loginHref} className={styles.tab}>Iniciar sesión</Link>
            <span className={`${styles.tab} ${styles.tabActive}`}>Crear cuenta</span>
          </div>

          <h2 className={styles.title}>Crear cuenta</h2>
          <p className={styles.lead}>
            Te enviaremos un correo para verificar tu dirección.
          </p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Nombre"   value={form.first_name} onChange={set('first_name')} error={errors.first_name} required autoComplete="given-name"  data-testid="register-first-name" />
              <Field label="Apellido" value={form.last_name}  onChange={set('last_name')}  error={errors.last_name}  required autoComplete="family-name" data-testid="register-last-name" />
            </div>
            <Field label="Correo electrónico" type="email" value={form.email} onChange={set('email')} error={errors.email} required autoComplete="email" data-testid="register-email" />
            <PasswordInput
              label="Contraseña"
              value={form.password}
              onChange={set('password')}
              error={errors.password}
              hint="· Mínimo 8 caracteres · No similar a tu correo · No demasiado común"
              autoComplete="new-password"
              data-testid="register-password"
            />
            <PasswordInput
              label="Confirmar contraseña"
              value={form.password_confirm}
              onChange={set('password_confirm')}
              error={errors.password_confirm}
              autoComplete="new-password"
              data-testid="register-password-confirm"
            />

            <label className={styles.checkboxLabel} style={{ alignItems: 'flex-start', marginTop: 4 }}>
              <input
                type="checkbox"
                checked={form.terms}
                onChange={(e) => setForm({ ...form, terms: e.target.checked })}
                data-testid="register-terms"
              />
              <span className={styles.checkbox} style={{ marginTop: 2 }} />
              <span>
                Acepto los <Link to="/info/terminos">términos</Link> y el{' '}
                <Link to="/info/privacidad">aviso de privacidad</Link>.
              </span>
            </label>
            {errors.terms && <div style={{ color: 'var(--c-vino-soft)', fontSize: 12 }}>{errors.terms}</div>}
            {errors._form && <div style={{ color: 'var(--c-vino-soft)', fontSize: 13 }}>{errors._form}</div>}

            <Button type="submit" variant="primary" block size="lg" disabled={loading} data-testid="register-submit">
              {loading ? 'Creando…' : 'Crear mi cuenta'}
            </Button>

            <div className={styles.footer}>
              ¿Ya tienes cuenta? <Link to={loginHref}>Inicia sesión →</Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
