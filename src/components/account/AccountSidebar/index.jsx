/**
 * AccountSidebar — Práctica Yorùbà
 * Navegación lateral para todas las páginas de /account/*
 */

import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styles from './AccountSidebar.module.scss';

const NAV = [
  { id: 'dashboard', to: '/account',               label: 'Resumen' },
  { id: 'orders',    to: '/account/orders',         label: 'Mis pedidos',     counter: 'orders' },
  { id: 'wishlist',  to: '/account/wishlist',       label: 'Lista de deseos', counter: 'wishlist' },
  { id: 'addresses', to: '/account/addresses',      label: 'Mis direcciones', counter: 'addresses' },
  { id: 'profile',   to: '/account/profile',        label: 'Datos personales' },
  { id: 'security',  to: '/account/security',       label: 'Seguridad' },
];

export default function AccountSidebar() {
  const counters = useSelector((s) => ({
    orders:    s.orders?.list?.length,
    wishlist:  s.wishlist?.items?.length,
    addresses: s.auth?.user?.addresses?.length,
  }));

  return (
    <aside className={styles.sidebar}>
      <nav>
        {NAV.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            end={item.to === '/account'}
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.linkActive : ''}`
            }
          >
            <span className={styles.label}>{item.label}</span>
            {item.counter && counters[item.counter] != null && (
              <span className={styles.counter}>{counters[item.counter]}</span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
