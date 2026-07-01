/**
 * CookiePreferencesModal — PracticaYoruba (Capa 2, LFPDPPP)
 *
 * Panel de preferencias granulares por proposito, sobre el Modal nativo de la
 * casa (<dialog>.showModal()). La categoria "necessary" esta bloqueada en ON
 * (estrictamente necesaria, exenta); el resto son opt-in (OFF por defecto).
 *
 * Ver analisis-ui-banner-consentimiento-cookies.
 */

import { useEffect, useState } from 'react';
import Modal from '@components/common/Modal/Modal';
import { useCookieConsent } from '@context/CookieConsentContext';
import { OPTIONAL_CATEGORIES } from '@lib/cookieConsent';
import styles from './CookiePreferencesModal.module.scss';

const LABELS = {
  necessary: {
    name: 'Estrictamente necesarias',
    desc: 'Requeridas para iniciar sesion y proteger el sitio (sesion, CSRF). Siempre activas.',
  },
  functional: {
    name: 'Funcionales',
    desc: 'Recuerdan tus preferencias no esenciales para mejorar la experiencia.',
  },
  analytics: {
    name: 'Analitica',
    desc: 'Nos ayudan a entender el uso del sitio de forma agregada.',
  },
  marketing: {
    name: 'Marketing',
    desc: 'Permiten mostrar contenido y campanas mas relevantes.',
  },
};

export default function CookiePreferencesModal() {
  const {
    preferencesOpen, closePreferences, savePreferences, choices,
  } = useCookieConsent();

  const [local, setLocal] = useState(choices);

  // Al abrir, sincroniza el estado local con las elecciones vigentes.
  useEffect(() => {
    if (preferencesOpen) setLocal(choices);
  }, [preferencesOpen, choices]);

  const toggle = (cat) =>
    setLocal((prev) => ({ ...prev, [cat]: !prev[cat] }));

  const acceptAllLocal = () =>
    setLocal({ necessary: true, functional: true, analytics: true, marketing: true });

  const rejectAllLocal = () =>
    setLocal({ necessary: true, functional: false, analytics: false, marketing: false });

  return (
    <Modal open={preferencesOpen} onClose={closePreferences} size="lg" centered scrollable>
      <div className={styles.panel}>
        <h2 className={styles.title}>Preferencias de cookies</h2>
        <p className={styles.intro}>
          Elige que categorias de cookies permites. Puedes cambiarlo cuando
          quieras desde el enlace del pie de pagina.
        </p>

        <ul className={styles.list}>
          <li className={styles.row}>
            <div className={styles.info}>
              <span className={styles.name}>{LABELS.necessary.name}</span>
              <span className={styles.desc}>{LABELS.necessary.desc}</span>
            </div>
            <label className={styles.switch}>
              <input type="checkbox" checked disabled aria-label={LABELS.necessary.name} />
              <span className={styles.locked}>Siempre activas</span>
            </label>
          </li>

          {OPTIONAL_CATEGORIES.map((cat) => (
            <li key={cat} className={styles.row}>
              <div className={styles.info}>
                <span className={styles.name}>{LABELS[cat].name}</span>
                <span className={styles.desc}>{LABELS[cat].desc}</span>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={Boolean(local[cat])}
                  onChange={() => toggle(cat)}
                  aria-label={LABELS[cat].name}
                />
                <span className={styles.slider} aria-hidden="true" />
              </label>
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          <button type="button" className={styles.ghost} onClick={rejectAllLocal}>
            Rechazar todo
          </button>
          <button type="button" className={styles.ghost} onClick={acceptAllLocal}>
            Aceptar todo
          </button>
          <button
            type="button"
            className={styles.save}
            onClick={() => savePreferences(local)}
          >
            Guardar preferencias
          </button>
        </div>
      </div>
    </Modal>
  );
}
