/**
 * Tests — usePublicSettings.
 *
 * Lectura tolerante a fallos de la configuracion del sitio para el
 * storefront. El hook:
 *   - llama GET /api/v1/config/settings/,
 *   - fusiona la respuesta sobre el `fallback`,
 *   - degrada al `fallback` (y expone `error`) si el endpoint falla,
 *   - expone { settings, isLoading, error } sin exigir QueryClientProvider.
 */
import { renderHook, waitFor } from '@testing-library/react';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

import apiService from '@services/apiService';
import usePublicSettings, { PUBLIC_SETTINGS_URL } from './usePublicSettings';

afterEach(() => jest.clearAllMocks());

describe('usePublicSettings', () => {
  it('llama al endpoint publico de settings', async () => {
    apiService.get.mockResolvedValue({ data: { iva_rate: '0.16' } });

    renderHook(() => usePublicSettings());

    await waitFor(() => expect(apiService.get).toHaveBeenCalledWith(PUBLIC_SETTINGS_URL));
    expect(PUBLIC_SETTINGS_URL).toBe('/api/v1/config/settings/');
  });

  it('fusiona la respuesta del backend sobre el fallback', async () => {
    apiService.get.mockResolvedValue({
      data: { iva_rate: '0.16', free_shipping_threshold: '999.00' },
    });

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
    const boom = Object.assign(new Error('Forbidden'), { status: 403 });
    apiService.get.mockRejectedValue(boom);

    const fallback = { iva_rate: '0.16', brand: 'PracticaYoruba' };
    const { result } = renderHook(() => usePublicSettings(fallback));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.settings).toEqual(fallback);
    expect(result.current.error).toBe(boom);
  });

  it('arranca en estado de carga', () => {
    apiService.get.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => usePublicSettings());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });
});
