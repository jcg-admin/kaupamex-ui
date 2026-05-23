import { Link } from 'react-router-dom';
import logoUrl from '@assets/practica-yoruba-logo.svg';
import styles from './Footer.module.scss';

const COLUMNS = [
  {
    title: 'Catálogo',
    items: [
      { to: '/catalog',                  label: 'Novedades' },
      { to: '/catalog?cat=por-orisha',   label: 'Por òrìsà' },
      { to: '/catalog?cat=por-ritual',   label: 'Por ritual' },
      { to: '/catalog?cat=elekes',       label: 'Elekes' },
      { to: '/catalog?cat=herramientas', label: 'Herramientas' },
      { to: '/catalog?cat=libros',       label: 'Libros & láminas' },
    ],
  },
  {
    title: 'Cuenta',
    items: [
      { to: '/auth/login',          label: 'Ingresar' },
      { to: '/auth/register',       label: 'Crear cuenta' },
      { to: '/account/orders',      label: 'Mis pedidos' },
      { to: '/account/addresses',   label: 'Direcciones' },
      { to: '/account/wishlist',    label: 'Lista de deseos' },
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
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        {/* Marca */}
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
            <div>hola@practicayoruba.com</div>
          </address>
        </div>

        {/* Columnas */}
        {COLUMNS.map((col) => (
          <div key={col.title} className={styles.col}>
            <h4 className={styles.colTitle}>{col.title}</h4>
            <ul className={styles.colList}>
              {col.items.map((item) => (
                <li key={item.to}>
                  <Link to={item.to}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div className={styles.bottom}>
        <div className={styles.bottomInner}>
          <span>© {new Date().getFullYear()} Práctica Yorùbà · practicayoruba.com</span>
          <span className={styles.payments}>
            <span>Mercado Pago</span>
            <span>PayPal</span>
            <span>SPEI</span>
            <span>OXXO Pay</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
