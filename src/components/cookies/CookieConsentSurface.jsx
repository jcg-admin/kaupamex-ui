/**
 * CookieConsentSurface — PracticaYoruba
 *
 * Monta la UI de consentimiento de cookies (banner no-modal + modal de
 * preferencias) dentro del árbol de rutas, para poder ocultarla en el panel
 * de administración. El aviso LFPDPPP es una preocupación del sitio público
 * (comprador); en el backoffice autenticado (``/admin/*``) estorbaba —
 * aparecía a la mitad de la vista del módulo. El estado del consentimiento lo
 * sigue proveyendo ``CookieConsentProvider`` (fuera del Router); aquí sólo se
 * decide DÓNDE se renderiza, usando ``useLocation``.
 */

import { useLocation } from 'react-router-dom';
import CookieConsentBanner from '@components/cookies/CookieConsentBanner';
import CookiePreferencesModal from '@components/cookies/CookiePreferencesModal';

export default function CookieConsentSurface() {
  const { pathname } = useLocation();
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return null;
  }
  return (
    <>
      <CookieConsentBanner />
      <CookiePreferencesModal />
    </>
  );
}
