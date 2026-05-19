/**
 * Footer — PracticaYoruba
 */

import { Link } from 'react-router-dom';
import styles from './Footer.module.scss';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.brandName}>PracticaYoruba</span>
          <p className={styles.tagline}>Productos sagrados de la tradición Yoruba</p>
        </div>
        <nav className={styles.nav} aria-label="Footer">
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Tienda</h4>
            <Link to="/catalog">Catálogo</Link>
            <Link to="/catalog?cat=collares">Collares</Link>
            <Link to="/catalog?cat=pulseras">Pulseras</Link>
            <Link to="/catalog?cat=ofrendas">Ofrendas</Link>
          </div>
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Mi cuenta</h4>
            <Link to="/account">Panel</Link>
            <Link to="/account/orders">Mis pedidos</Link>
            <Link to="/account/wishlist">Favoritos</Link>
          </div>
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Ayuda</h4>
            <Link to="/contacto">Contacto</Link>
            <Link to="/envios">Envíos y devoluciones</Link>
            <Link to="/privacidad">Privacidad</Link>
          </div>
        </nav>
      </div>
      <div className={styles.bottom}>
        <p>© {new Date().getFullYear()} PracticaYoruba. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
