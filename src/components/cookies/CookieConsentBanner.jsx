/**
 * CookieConsentBanner — PracticaYoruba (Capa 1, LFPDPPP)
 *
 * Aviso de cookies NO modal (no atrapa foco, no bloquea la pagina). Cumple los
 * requisitos: aviso + Aceptar todo + Rechazar todo (igual prominencia) +
 * enlace a la politica de privacidad + acceso a preferencias granulares.
 *
 * Se muestra solo cuando hace falta consentimiento y el modal de preferencias
 * no esta abierto. Ver analisis-ui-banner-consentimiento-cookies.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { useCookieConsent } from '@context/CookieConsentContext';
import styles from './CookieConsentBanner.module.scss';

export default function CookieConsentBanner() {
  const {
    needsChoice, preferencesOpen,
    acceptAll, rejectAll, openPreferences,
  } = useCookieConsent();

  const visible = needsChoice && !preferencesOpen;

  return (
    <AnimatePresence>
      {visible && (
        <motion.section
          className={styles.banner}
          role="region"
          aria-label="Consentimiento de cookies"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <div className={styles.text}>
            <h2 className={styles.title}>Usamos cookies</h2>
            <p className={styles.body}>
              Usamos cookies necesarias para el funcionamiento del sitio y,
              con tu permiso, cookies opcionales para mejorar tu experiencia.
              Puedes aceptarlas, rechazarlas o elegir por categoria. Consulta
              nuestro{' '}
              <a href="/info/privacidad" className={styles.link}>
                aviso de privacidad
              </a>.
            </p>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondary}
              onClick={openPreferences}
            >
              Preferencias
            </button>
            <button
              type="button"
              className={styles.primary}
              onClick={rejectAll}
            >
              Rechazar todo
            </button>
            <button
              type="button"
              className={styles.primary}
              onClick={acceptAll}
            >
              Aceptar todo
            </button>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
