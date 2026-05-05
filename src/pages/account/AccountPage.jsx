/**
 * AccountPage — PracticaYoruba
 * Hub de la cuenta del comprador. Muestra resumen y navegacion
 * a las secciones de perfil, direcciones y ordenes.
 *
 * Sprint 2:
 *   - Con PY_PROFILE_SOURCE=mock usa datos del MockRegistry.
 *   - Con PY_PROFILE_SOURCE=real usa GET /api/v1/auth/profile/.
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchProfile } from '@redux/slices/authSlice';
import { selectUser, selectAuthLoading } from '@redux/selectors';
import { loadMock } from '@mocks/registry';
import styles from './AccountPage.module.scss';

const USE_MOCK = process.env.PY_PROFILE_SOURCE === 'mock';

const NAV_ITEMS = [
  { to: '/account/profile',   label: 'Mi perfil',          desc: 'Datos personales y avatar' },
  { to: '/account/addresses', label: 'Mis direcciones',     desc: 'Direcciones de envio guardadas' },
  { to: '/account/orders',    label: 'Mis pedidos',         desc: 'Historial y estado de ordenes' },
  { to: '/account/wishlist',  label: 'Lista de deseos',     desc: 'Productos que te interesan' },
  { to: '/account/password',  label: 'Cambiar contrasena',  desc: 'Seguridad de la cuenta' },
];

export default function AccountPage() {
  const dispatch  = useDispatch();
  const user      = useSelector(selectUser);
  const isLoading = useSelector(selectAuthLoading);

  useEffect(() => {
    if (USE_MOCK) {
      const mockProfile = loadMock('profile');
      dispatch({ type: 'auth/fetchProfile/fulfilled', payload: mockProfile });
    } else {
      dispatch(fetchProfile());
    }
  }, [dispatch]);

  if (isLoading && !user) {
    return <div className={styles.page}><p>Cargando cuenta...</p></div>;
  }

  const greeting = user?.first_name ? `Hola, ${user.first_name}` : 'Mi cuenta';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{greeting}</h1>
        {user?.email && <p className={styles.email}>{user.email}</p>}
        {user?.profile_completeness !== undefined && user.profile_completeness < 100 && (
          <p className={styles.completeness}>
            Perfil completado al {user.profile_completeness}%
            {' — '}
            <Link to="/account/profile">Completar ahora</Link>
          </p>
        )}
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ to, label, desc }) => (
          <Link key={to} to={to} className={styles.navItem}>
            <span className={styles.navLabel}>{label}</span>
            <span className={styles.navDesc}>{desc}</span>
          </Link>
        ))}
      </nav>

      {USE_MOCK && (
        <p className={styles.mockBadge}>Modo mock activo (PY_PROFILE_SOURCE=mock)</p>
      )}
    </div>
  );
}
