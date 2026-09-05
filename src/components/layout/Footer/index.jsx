/**
 * Footer — Práctica Yorùbà
 * 5 columnas: marca, catálogo, cuenta, tradición, apoyo.
 */

import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import logoUrl from '@assets/practica-yoruba-logo.png';
import { useCookieConsent } from '@context/CookieConsentContext';
import styles from './Footer.module.scss';

// Columnas estaticas (la de "Catalogo" se arma dinamica con categorias reales).
const COLUMNS = [
  {
    title: 'Cuenta',
    items: [
      { to: '/auth/login',           label: 'Ingresar' },
      { to: '/auth/register',        label: 'Crear cuenta' },
      { to: '/account/orders',       label: 'Mis pedidos' },
      { to: '/account/addresses',    label: 'Direcciones' },
      { to: '/account/wishlist',     label: 'Mis deseos' },
    ],
  },
  {
    title: 'Tradición',
    items: [
      { to: '/info/ifa',         label: 'Qué es Ifá' },
      { to: '/info/orishas',     label: 'Los òrìsà' },
      { to: '/info/pataki',      label: 'Pataki' },
      { to: '/info/santoral',    label: 'Calendario del santoral' },
      { to: '/info/glosario',    label: 'Glosario Yorùbà' },
    ],
  },
  {
    title: 'Apoyo',
    items: [
      { to: '/info/envios',      label: 'Envíos & devoluciones' },
      { to: '/info/pago',        label: 'Formas de pago' },
      { to: '/info/terminos',    label: 'Términos y condiciones' },
      { to: '/info/privacidad',  label: 'Aviso de privacidad' },
      { to: '/info/faq',         label: 'Preguntas frecuentes' },
    ],
  },
];

export default function Footer() {
  // Categorias reales de la API (las carga el Header); fallback a [].
  const categories = useSelector((s) => s.catalog?.categories ?? []);
  // Retiro/edicion del consentimiento de cookies (LFPDPPP): centro de
  // preferencias siempre accesible desde el pie de pagina.
  const { openPreferences } = useCookieConsent();
  // T-04: las entradas de auth llevan la pagina actual para regresar a ella
  // tras login/registro (las demas entradas ya lo hacen; el footer no lo hacia).
  const location = useLocation();
  const catalogoCol = {
    title: 'Catálogo',
    items: [
      { to: '/catalog', label: 'Novedades' },
      ...categories.slice(0, 5).map((c) => ({
        to: `/catalog?cat=${c.slug}`,
        label: c.name,
      })),
    ],
  };
  const columns = [catalogoCol, ...COLUMNS];
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandCol}>
          <Link to="/" className={styles.brand} aria-label="Inicio">
            <img
              src={logoUrl}
              alt=""
              aria-hidden="true"
              className={styles.brandLogo}
            />
            <div>
              <div className={styles.brandName}>Práctica Yorùbà</div>
              <div className={styles.brandTag}>Ifá · Òrìsà · Olódùmarè</div>
            </div>
          </Link>
          <p className={styles.brandDesc}>
            Objetos rituales para la práctica de Ifá y el culto a los òrìsà: elekes,
            otanes, soperas, herramientas y materiales que la liturgia Yorùbà requiere.
          </p>
          <address className={styles.brandMeta}>
            <div>Atención en línea</div>
            <div>Lunes a viernes · 10:00 — 19:00</div>
            <div>hola@kaupamex.com</div>
          </address>
        </div>

        {columns.map((col) => (
          <div key={col.title} className={styles.col}>
            <h4 className={styles.colTitle}>{col.title}</h4>
            <ul className={styles.colList}>
              {col.items.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    state={item.to.startsWith('/auth/') ? { from: location } : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className={styles.bottom}>
        <div className={styles.bottomInner}>
          <span>© {new Date().getFullYear()} Práctica Yorùbà · kaupamex.com</span>
          <button
            type="button"
            className={styles.cookiePrefs}
            onClick={openPreferences}
          >
            Preferencias de cookies
          </button>
          <span className={styles.payments}>
            <span>Mercado Pago</span>
            <span>SPEI</span>
            <span>OXXO Pay</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
