/**
 * CookieConsentContext — PracticaYoruba
 * Estado global del consentimiento de cookies (LFPDPPP).
 *
 * Molde: mismo patron provider + hook que ToastContext. Expone el estado y las
 * acciones; la UI (banner no-modal + modal de preferencias) se monta en
 * CookieConsentSurface, dentro del Router, para ocultarla en /admin.
 * Ver analisis-ui-banner-consentimiento-cookies.
 */

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  needsConsent,
  currentChoices,
  writeConsent,
  allChoices,
  necessaryOnlyChoices,
} from '@lib/cookieConsent';
const CookieConsentContext = createContext(null);

export function CookieConsentProvider({ children }) {
  const [choices, setChoices] = useState(() => currentChoices());
  const [needsChoice, setNeedsChoice] = useState(() => needsConsent());
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  const persist = useCallback((next) => {
    const record = writeConsent(next);
    setChoices(record.choices);
    setNeedsChoice(false);
    return record;
  }, []);

  const acceptAll = useCallback(() => persist(allChoices()), [persist]);

  const rejectAll = useCallback(() => persist(necessaryOnlyChoices()), [persist]);

  const savePreferences = useCallback((next) => {
    persist(next);
    setPreferencesOpen(false);
  }, [persist]);

  const openPreferences = useCallback(() => setPreferencesOpen(true), []);
  const closePreferences = useCallback(() => setPreferencesOpen(false), []);

  const value = useMemo(() => ({
    choices,
    needsChoice,
    preferencesOpen,
    acceptAll,
    rejectAll,
    savePreferences,
    openPreferences,
    closePreferences,
  }), [
    choices, needsChoice, preferencesOpen,
    acceptAll, rejectAll, savePreferences, openPreferences, closePreferences,
  ]);

  // La UI (banner + modal) se monta en CookieConsentSurface, dentro del Router,
  // para poder ocultarla en /admin (useLocation no está disponible aquí, fuera
  // del BrowserRouter). Este provider sólo expone el estado.
  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error('useCookieConsent debe usarse dentro de CookieConsentProvider');
  }
  return ctx;
}

export default CookieConsentContext;
