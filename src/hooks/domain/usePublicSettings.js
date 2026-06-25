/**
 * usePublicSettings — lectura del storefront de la configuracion del sitio.
 *
 * Expone el subconjunto de SiteSettings que el storefront necesita para
 * calcular precios y envio (iva_rate, free_shipping_threshold) y flags de
 * branding. Devuelve siempre un objeto plano combinando un `fallback` con
 * la respuesta del backend.
 *
 *   GET /api/v2/config/settings/   (SiteSettingsView)
 *
 * Diseno tolerante a fallos (NO usa React Query a proposito): el consumidor
 * tipico (Footer / banner de envio gratis) se monta en casi todas las vistas
 * y no debe exigir un QueryClientProvider ni romper el render si el endpoint
 * falla. Ante cualquier error se conserva el `fallback`.
 *
 * Hallazgo (H-UI-01): en la api actual `SiteSettingsView` esta protegida con
 * [IsAuthenticated, IsAdminUser] — NO es publica. Para un visitante anonimo
 * el GET responde 401/403 y el hook degrada al `fallback`. El hook ya se
 * comporta correctamente bajo ese contrato; si la api expone luego un
 * endpoint AllowAny, solo cambia la constante URL. Ver el reporte de
 * hallazgos de esta iniciativa.
 *
 * Retorna `{ settings, isLoading, error }`:
 *   - settings: fallback fusionado con la respuesta (siempre un objeto).
 *   - isLoading: true mientras el primer fetch esta en curso.
 *   - error: el Error capturado si el fetch fallo (null si ok o aun cargando).
 */
import { useEffect, useState } from 'react';
import apiService from '@services/apiService';

export const PUBLIC_SETTINGS_URL = '/api/v2/config/settings/';

export function usePublicSettings(fallback = {}) {
  const [settings, setSettings] = useState(fallback);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        // `await` tolera que apiService.get devuelva undefined (mocks).
        const res = await apiService.get(PUBLIC_SETTINGS_URL);
        if (!alive) return;
        if (res?.data) setSettings((prev) => ({ ...prev, ...res.data }));
        setError(null);
      } catch (err) {
        // Degradado: se conserva el fallback y se expone el error para
        // que el consumidor pueda decidir (sin romper el render).
        if (alive) setError(err);
      } finally {
        if (alive) setIsLoading(false);
      }
    })();

    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { settings, isLoading, error };
}

export default usePublicSettings;
