/**
 * CookiePreferencesModal — Kaupamex (Capa 2, LFPDPPP)
 *
 * Panel de preferencias granulares por proposito, sobre el Modal nativo de la
 * casa (<dialog>.showModal()). La categoria "necessary" esta bloqueada en ON
 * (estrictamente necesaria, exenta); el resto vienen activadas por defecto
 * (modelo opt-out) pero se pueden desactivar libremente.
 *
 * Ver analisis-ui-banner-consentimiento-cookies.
 */

import { useEffect, useState } from 'react';
import Modal from '@components/common/Modal/Modal';
import Switch from '@components/common/Switch/Switch';
import { useCookieConsent } from '@context/CookieConsentContext';
import { OPTIONAL_CATEGORIES } from '@lib/cookieConsent';
import styles from './CookiePreferencesModal.module.scss';

const LABELS = {
  necessary: {
    name: 'Estrictamente necesarias',
    desc: 'Mantienen tu sesion de servidor activa para que puedas navegar y comprar. Siempre activas.',
  },
  functional: {
    name: 'Funcionales',
    desc: 'Recuerdan tus preferencias (idioma, favoritos, carrito) para que tu tienda se sienta tuya.',
  },
  analytics: {
    name: 'Analitica',
    desc: 'Nos muestran, de forma agregada, que te gusta para seguir mejorando la experiencia.',
  },
  marketing: {
    name: 'Marketing',
    desc: 'Te acercan productos Yoruba y promociones pensados para ti, sin ruido de lo que no te interesa.',
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
        <h2 className={styles.title}>Tus preferencias de cookies</h2>
        <p className={styles.intro}>
          Estas categorias vienen activadas para acompanar tu experiencia de
          compra. Deja las que te sumen y desactiva las que no; puedes
          cambiarlo cuando quieras desde el enlace del pie de pagina.
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
              <Switch
                checked={Boolean(local[cat])}
                onChange={() => toggle(cat)}
                ariaLabel={LABELS[cat].name}
              />
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
