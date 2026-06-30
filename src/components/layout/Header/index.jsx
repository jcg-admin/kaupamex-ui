/**
 * Header — Práctica Yorùbà
 * Cabecera con logo, tagline IFÁ · ÒRÌSÀ · OLÓDÙMARÈ,
 * navegación Yorùbà (por òrìsà / ritual / elekes / herramientas / libros),
 * búsqueda, cuenta y carrito.
 */

import { useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectIsAuthenticated,
  selectCartItemCount,
  selectIsSearchOpen,
} from '@redux/selectors';
import { toggleSearch, openModal } from '@redux/slices/uiSlice';
import { fetchCategories } from '@redux/slices/catalogSlice';
import logoUrl from '@assets/practica-yoruba-logo.png';
import styles from './Header.module.scss';

// Cuantas categorias mostrar en la barra antes de "Catalogo completo".
const NAV_LIMIT = 6;

export default function Header() {
  const dispatch     = useDispatch();
  const isAuth       = useSelector(selectIsAuthenticated);
  const cartCount    = useSelector(selectCartItemCount);
  const isSearchOpen = useSelector(selectIsSearchOpen);
  // El menu de categorias se arma con las categorias REALES de la API
  // (antes eran slugs hardcodeados que no existian -> 0 resultados).
  const categories   = useSelector((s) => s.catalog?.categories ?? []);
  const mainNav = categories.slice(0, NAV_LIMIT);

  useEffect(() => {
    if (categories.length === 0) dispatch(fetchCategories());
  }, [dispatch, categories.length]);

  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        dispatch(toggleSearch());
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dispatch]);

  return (
    <header className={styles.header}>
      {/* ─── Top utility strip ─── */}
      <div className={styles.topStrip}>
        <div className={styles.topStripInner}>
          <div className={styles.topStripLeft}>
            <span>
              Envío gratis en pedidos &gt;{' '}
              <b className={styles.bronze}>$1,500 MXN</b>
            </span>
            <span className={styles.dot}>·</span>
            <span>Atención L-V 10:00 — 19:00 · Envíos a toda la república</span>
          </div>
          <div className={styles.topStripRight}>
            <Link to="/help">Ayuda</Link>
            <Link to="/account/orders">Rastrear pedido</Link>
            <Link to="/contact">Contacto</Link>
          </div>
        </div>
      </div>

      {/* ─── Main bar: logo + search + actions ─── */}
      <div className={styles.mainBar}>
        <div className={styles.mainBarInner}>
          <Link to="/" className={styles.brand} aria-label="Inicio">
            <img
              src={logoUrl}
              alt=""
              aria-hidden="true"
              className={styles.brandLogo}
            />
            <span className={styles.brandText}>
              <span className={styles.brandName}>Práctica Yorùbà</span>
              <span className={styles.brandTag}>Ifá · Òrìsà · Olódùmarè</span>
            </span>
          </Link>

          <button
            type="button"
            className={styles.searchTrigger}
            onClick={() => dispatch(toggleSearch())}
            aria-label="Buscar productos"
            aria-expanded={isSearchOpen}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <span className={styles.searchPlaceholder}>
              Buscar elekes, otanes, herramientas de òrìsà…
            </span>
            <kbd className={styles.searchKbd}>⌘ K</kbd>
          </button>

          <div className={styles.actions}>
            {isAuth ? (
              <Link to="/account" className={styles.actionLink}>
                Mi cuenta
              </Link>
            ) : (
              <button
                type="button"
                className={styles.actionLink}
                onClick={() => dispatch(openModal({ modal: 'auth' }))}
              >
                Ingresar
              </button>
            )}

            <Link to="/account/wishlist" className={styles.actionLink}>
              Deseos
            </Link>

            <Link
              to="/cart"
              className={styles.cartBtn}
              aria-label={`Carrito (${cartCount} ${cartCount === 1 ? 'pieza' : 'piezas'})`}
            >
              Bolsa
              <span className={styles.cartCount}>
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Categories nav ─── */}
      <nav className={styles.categoriesNav} aria-label="Categorías Yorùbà">
        <div className={styles.categoriesInner}>
          {mainNav.map((cat) => (
            <NavLink
              key={cat.slug}
              to={`/catalog?cat=${cat.slug}`}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              {cat.name}
            </NavLink>
          ))}
          <span className={styles.navSpacer} />
          <Link to="/catalog" className={styles.navLinkAccent}>
            · Catálogo completo →
          </Link>
        </div>
      </nav>
    </header>
  );
}
