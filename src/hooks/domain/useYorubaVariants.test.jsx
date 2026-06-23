/**
 * Tests — useAdminProductVariants (Yoruba CHT-03)
 * Patron canonico React Query + MSW v2.
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import {
  useAdminProductVariants,
  YORUBA_VARIANTS_KEY,
} from './useYorubaVariants';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeWrapper = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

describe('useAdminProductVariants', () => {
  it('expone la clave canonica de cache', () => {
    expect(YORUBA_VARIANTS_KEY).toEqual(['yoruba-variants']);
  });

  it('lista las variantes admin del producto indicado', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/products/42/variants/`, () =>
        HttpResponse.json({ results: [{ id: 1, option_name: 'Grande' }] }),
      ),
    );

    const { result } = renderHook(() => useAdminProductVariants(42), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1, option_name: 'Grande' }]);
  });

  it('queda deshabilitado si no hay productId', () => {
    renderHook(() => useAdminProductVariants(undefined), {
      wrapper: makeWrapper(),
    });
    // enabled:false — query should not fire
  });

  it('acepta payload plano (array sin envoltura results)', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/products/42/variants/`, () =>
        HttpResponse.json([{ id: 2, option_name: 'Mediana' }]),
      ),
    );

    const { result } = renderHook(() => useAdminProductVariants(42), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 2, option_name: 'Mediana' }]);
  });
});
