/**
 * HelpPage — Centro de ayuda (/help)
 * Página de soporte con opciones de contacto.
 */

import { Link } from 'react-router-dom';
import styles from './HelpPage.module.scss';

const TOPICS = [
  {
    title: 'Pedidos y pagos',
    links: [
      { to: '/info/pago',   label: 'Formas de pago aceptadas' },
      { to: '/info/envios', label: 'Envíos y tiempos de entrega' },
      { to: '/info/envios', label: 'Devoluciones y reembolsos' },
      { to: '/info/faq',    label: 'Preguntas frecuentes' },
    ],
  },
  {
    title: 'Mi cuenta',
    links: [
      { to: '/account',         label: 'Ver mis pedidos' },
      { to: '/account/profile', label: 'Actualizar mis datos' },
      { to: '/auth/login',      label: 'Iniciar sesión' },
      { to: '/auth/register',   label: 'Crear una cuenta' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { to: '/info/terminos',   label: 'Términos y condiciones' },
      { to: '/info/privacidad', label: 'Aviso de privacidad' },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>Centro de ayuda</h1>
        <p className={styles.subtitle}>
          ¿Cómo podemos ayudarte? Encuentra respuestas o contáctanos directamente.
        </p>

        <div className={styles.grid}>
          {TOPICS.map((topic) => (
            <section key={topic.title} className={styles.card}>
              <h2 className={styles.cardTitle}>{topic.title}</h2>
              <ul className={styles.cardList}>
                {topic.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Contacto directo</h2>
            <ul className={styles.cardList}>
              <li>
                <Link to="/contact">Formulario de contacto</Link>
              </li>
              <li>
                <a href="mailto:hola@practicayoruba.com">hola@practicayoruba.com</a>
              </li>
              <li>
                <Link to="/support/tickets/new">Abrir un ticket de soporte</Link>
              </li>
            </ul>
            <p className={styles.hours}>Atención L­V · 10:00–19:00 hrs</p>
          </section>
        </div>
      </div>
    </div>
  );
}
