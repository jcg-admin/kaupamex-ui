/**
 * Header — PracticaYoruba
 * Cabecera de la tienda: logo, navegación, búsqueda, carrito y cuenta.
 */

import { Link, NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectIsAuthenticated,
  selectCartItemCount,
  selectIsSearchOpen,
} from '@redux/selectors';
import { toggleSearch, openModal } from '@redux/slices/uiSlice';
import styles from './Header.module.scss';

const MAIN_NAV = [
  { to: '/catalogo',               label: 'Catálogo' },
  { to: '/catalogo?cat=collares',  label: 'Collares' },
  { to: '/catalogo?cat=pulseras',  label: 'Pulseras' },
  { to: '/catalogo?cat=ofrendas',  label: 'Ofrendas' },
];

export default function Header() {
  const dispatch        = useDispatch();
  const isAuth          = useSelector(selectIsAuthenticated);
  const cartCount       = useSelector(selectCartItemCount);
  const isSearchOpen    = useSelector(selectIsSearchOpen);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link to="/" className={styles.brand}>
          <span className={styles.brandName}>PracticaYoruba</span>
        </Link>

        {/* Navegación principal */}
        <nav className={styles.nav} aria-label="Categorías">
          {MAIN_NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Acciones */}
        <div className={styles.actions}>
          {/* Búsqueda */}
          <button
            className={styles.iconBtn}
            onClick={() => dispatch(toggleSearch())}
            aria-label="Buscar"
            aria-expanded={isSearchOpen}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>

          {/* Cuenta / Login */}
          {isAuth ? (
            <Link to="/mi-cuenta" className={styles.iconBtn} aria-label="Mi cuenta">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>
          ) : (
            <button
              className={styles.iconBtn}
              onClick={() => dispatch(openModal({ modal: 'auth' }))}
              aria-label="Iniciar sesión"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </button>
          )}

          {/* Carrito */}
          <Link to="/carrito" className={styles.cartBtn} aria-label={`Carrito (${cartCount} items)`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {cartCount > 0 && (
              <span className={styles.cartCount}>{cartCount > 99 ? '99+' : cartCount}</span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
