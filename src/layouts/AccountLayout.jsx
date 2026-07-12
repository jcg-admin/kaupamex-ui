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
import Avatar from '@components/common/Avatar/Avatar';
import BadgeContainer from '@components/common/BadgeContainer/BadgeContainer';
import Badge from '@components/common/Badge/Badge';
import ToastContainer from '@components/common/Toast/ToastContainer';
import { useUnreadNotificationsCount } from '@hooks/domain/useNotifications';
import useAccountMenu from '@hooks/domain/useAccountMenu';
import styles from './AccountLayout.module.scss';

// Fallback estático (degradación): el menú real es registro-dirigido y viene de
// GET /me/menu/?audience=account (DEC-AUTHZ-BUYER). Esta lista solo se usa
// mientras carga, si el endpoint falla, o si el usuario aún no tiene el rol
// 'comprador'. Agregar un ítem NUEVO se hace sembrando una fila en el backend
// (seed_menu), no editando esta lista.
const NAV_ITEMS = [
  { to: '/account',                              label: 'Resumen',          end: true },
  { to: '/account/orders',                       label: 'Mis pedidos'  },
  { to: '/account/wishlist',                     label: 'Mis favoritos' },
  { to: '/account/returns',                      label: 'Mis devoluciones' },
  { to: '/support/tickets',                      label: 'Soporte' },
  { to: '/account/notifications',                label: 'Notificaciones', badge: true },
  { to: '/account/profile',                      label: 'Mi perfil' },
  { to: '/account/change-password',              label: 'Cambiar contrasena' },
  // UC-AUTH-16: deliberadamente al final del menu para no confundirlo
  // con opciones cotidianas. La pagina tiene confirmacion explicita
  // antes de invocar el endpoint de baja.
  { to: '/account/deactivate',                   label: 'Dar de baja' },
];

export default function AccountLayout() {
  const user = useSelector(selectUser);
  const { data: unreadCount = 0 } = useUnreadNotificationsCount({ enabled: !!user });
  const { items: navItems } = useAccountMenu(NAV_ITEMS, { enabled: !!user });

  return (
    <div className={styles.root}>
      <Header />
      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <div className={styles.userCard}>
            <Avatar className={styles.avatar} initials={user?.first_name?.[0] ?? '?'} />
            <div>
              <p className={styles.userName}>
                {user?.first_name} {user?.last_name}
              </p>
              <p className={styles.userEmail}>{user?.email}</p>
            </div>
          </div>
          <nav className={styles.nav} aria-label="Menu de cuenta">
            {navItems.map(({ to, label, end, badge }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                }
              >
                {badge && unreadCount > 0 ? (
                  <BadgeContainer>
                    {label}
                    <Badge
                      align={{ vertical: 'top', horizontal: 'end' }}
                      size="small"
                      themeColor="secondary"
                      aria-label={`${unreadCount} sin leer`}
                    >
                      {unreadCount}
                    </Badge>
                  </BadgeContainer>
                ) : label}
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
