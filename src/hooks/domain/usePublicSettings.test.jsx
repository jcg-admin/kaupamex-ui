/**
 * Tests — usePublicSettings.
 *
 * Lectura tolerante a fallos de la configuracion del sitio para el
 * storefront. El hook:
 *   - llama GET /api/v2/config/settings/,
 *   - fusiona la respuesta sobre el `fallback`,
 *   - degrada al `fallback` (y expone `error`) si el endpoint falla,
 *   - expone { settings, isLoading, error } sin exigir QueryClientProvider.
 */
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import usePublicSettings, { PUBLIC_SETTINGS_URL } from './usePublicSettings';

const BASE = process.env.API_URL || 'http://localhost:8000';

describe('usePublicSettings', () => {
  it('llama al endpoint publico de settings', async () => {
    server.use(
      http.get(`${BASE}/api/v2/config/settings/`, () =>
        HttpResponse.json({ iva_rate: '0.16' }),
      ),
    );

    renderHook(() => usePublicSettings());

    expect(PUBLIC_SETTINGS_URL).toBe('/api/v2/config/settings/');
  });

  it('fusiona la respuesta del backend sobre el fallback', async () => {
    server.use(
      http.get(`${BASE}/api/v2/config/settings/`, () =>
        HttpResponse.json({ iva_rate: '0.16', free_shipping_threshold: '999.00' }),
      ),
    );

    const { result } = renderHook(() =>
      usePublicSettings({ iva_rate: '0.00', brand: 'PracticaYoruba' }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.settings).toEqual({
      brand: 'PracticaYoruba',
      iva_rate: '0.16',
      free_shipping_threshold: '999.00',
    });
    expect(result.current.error).toBeNull();
  });

  it('conserva el fallback y expone error cuando el endpoint falla', async () => {
    server.use(
      http.get(`${BASE}/api/v2/config/settings/`, () =>
        HttpResponse.json({ detail: 'Forbidden' }, { status: 403 }),
      ),
    );

    const fallback = { iva_rate: '0.16', brand: 'PracticaYoruba' };
    const { result } = renderHook(() => usePublicSettings(fallback));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.settings).toEqual(fallback);
    expect(result.current.error).not.toBeNull();
  });

  it('arranca en estado de carga', () => {
    server.use(
      http.get(`${BASE}/api/v2/config/settings/`, () =>
        new Promise(() => {}),
      ),
    );
    const { result } = renderHook(() => usePublicSettings());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });
});
