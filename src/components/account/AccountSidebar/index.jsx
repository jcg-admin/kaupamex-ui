/**
 * AccountSidebar — Práctica Yorùbà
 * Navegación lateral para todas las páginas de /mi-cuenta/*
 *
 * Uso:
 *   <AccountSidebar active="orders" />
 *
 * Lee del store los contadores (pedidos, deseos, direcciones) para
 * mostrarlos junto al label de cada link.
 */

import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styles from './AccountSidebar.module.scss';

const NAV = [
  { id: 'dashboard', to: '/mi-cuenta',              label: 'Resumen' },
  { id: 'orders',    to: '/mi-cuenta/pedidos',      label: 'Mis pedidos',     counter: 'orders' },
  { id: 'wishlist',  to: '/mi-cuenta/favoritos',    label: 'Lista de deseos', counter: 'wishlist' },
  { id: 'addresses', to: '/mi-cuenta/direcciones',  label: 'Mis direcciones', counter: 'addresses' },
  { id: 'profile',   to: '/mi-cuenta/perfil',       label: 'Datos personales' },
  { id: 'security',  to: '/mi-cuenta/seguridad',    label: 'Seguridad' },
];

export default function AccountSidebar() {
  // Contadores desde Redux. Si tu store no tiene aún estos selectors,
  // devolverá undefined y simplemente no se muestra el contador.
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
            end={item.to === '/mi-cuenta'}
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
