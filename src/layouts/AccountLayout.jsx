/**
 * AccountLayout — PracticaYoruba
 * Layout de la cuenta del comprador: sidebar de navegación + contenido.
 * Usado por: AccountPage, OrdersPage, WishlistPage, ProfilePage.
 */

import { NavLink, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '@redux/selectors';
import Header from '@components/layout/Header';
import Footer from '@components/layout/Footer';
import ToastContainer from '@components/common/Toast/ToastContainer';
import styles from './AccountLayout.module.scss';

const NAV_ITEMS = [
  { to: '/account',                              label: 'Resumen',          end: true },
  { to: '/account/orders',                       label: 'Mis pedidos'  },
  { to: '/account/wishlist',                     label: 'Mis favoritos' },
  { to: '/account/returns',                      label: 'Mis devoluciones' },
  { to: '/support/tickets',                      label: 'Soporte' },
  { to: '/account/notifications/preferences',    label: 'Notificaciones' },
  { to: '/account/profile',                      label: 'Mi perfil' },
  { to: '/account/change-password',              label: 'Cambiar contrasena' },
];

export default function AccountLayout() {
  const user = useSelector(selectUser);

  return (
    <div className={styles.root}>
      <Header />
      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <div className={styles.userCard}>
            <div className={styles.avatar}>
              {user?.first_name?.[0] ?? '?'}
            </div>
            <div>
              <p className={styles.userName}>
                {user?.first_name} {user?.last_name}
              </p>
              <p className={styles.userEmail}>{user?.email}</p>
            </div>
          </div>
          <nav className={styles.nav} aria-label="Menu de cuenta">
            {NAV_ITEMS.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
      <Footer />
      <ToastContainer />
    </div>
  );
}
