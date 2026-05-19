/**
 * Tests — SearchResultsPage (UC-CAT-03 + UC-CAT-03-EXT).
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

import apiService from '@services/apiService';
import SearchResultsPage from './SearchResultsPage';

const PRODUCT_A = {
  id: 1, name: 'Collar Oshun', slug: 'collar-oshun',
  sku: 'OSH-001', base_price: '1200.00', price_with_tax: 1392,
  stock: 5, category_name: 'Collares', highlighted_name: 'Collar <mark>Oshun</mark>',
};

const renderAt = (search = '?q=oshun') => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/search${search}`]}>
        <Routes>
          <Route path="/search" element={<SearchResultsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const CATEGORIES_FIXTURE = [
  { id: 1, slug: 'collares', name: 'Collares', product_count: 5, children: [] },
];

beforeEach(() => {
  apiService.get.mockImplementation((url) => {
    if (typeof url === 'string' && url.includes('/categories')) {
      return Promise.resolve({ data: { results: CATEGORIES_FIXTURE, count: 1 } });
    }
    return Promise.resolve({
      data: { results: [PRODUCT_A], count: 1, active_filters: {}, normalized_query: 'oshun' },
    });
  });
});

afterEach(() => jest.clearAllMocks());

describe('SearchResultsPage (UC-CAT-03 + UC-CAT-03-EXT)', () => {
  it('muestra el titulo «Resultados de busqueda»', async () => {
    renderAt('?q=oshun');
    expect(
      await screen.findByRole('heading', { name: /resultados de busqueda/i }),
    ).toBeInTheDocument();
  });

  it('muestra el contador y el termino buscado', async () => {
    renderAt('?q=oshun');
    expect(await screen.findByText(/1 resultado/i)).toBeInTheDocument();
    expect(screen.getByText(/«oshun»/)).toBeInTheDocument();
  });

  it('renderiza los productos encontrados', async () => {
    renderAt('?q=oshun');
    expect(await screen.findByText(/collar/i)).toBeInTheDocument();
  });

  it('llama a /api/v1/catalogue/search/ con el termino normalizado', async () => {
    renderAt('?q=oshun');
    await waitFor(() => {
      const call = apiService.get.mock.calls.find(
        ([url]) => typeof url === 'string' && url.includes('/catalogue/search/'),
      );
      expect(call?.[1]?.params?.q).toBe('oshun');
    });
  });

  it('reenvia los filtros (category, price_min, price_max) a la API (UC-CAT-03-EXT)', async () => {
    renderAt('?q=oshun&category=collares&price_min=100&price_max=500');
    await waitFor(() => {
      const call = apiService.get.mock.calls.find(
        ([url]) => typeof url === 'string' && url.includes('/catalogue/search/'),
      );
      expect(call?.[1]?.params).toMatchObject({
        q: 'oshun', category: 'collares',
        price_min: '100', price_max: '500',
      });
    });
  });

  it('no consulta la API cuando el termino es demasiado corto (Alt C)', async () => {
    renderAt('?q=a');
    expect(
      await screen.findByText(/al menos 2 caracteres/i),
    ).toBeInTheDocument();
    const searchCall = apiService.get.mock.calls.find(
      ([url]) => typeof url === 'string' && url.includes('/catalogue/search/'),
    );
    expect(searchCall).toBeUndefined();
  });

  it('muestra estado «sin resultados» con sugerencias accionables (Alt A)', async () => {
    apiService.get.mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/categories')) {
        return Promise.resolve({ data: { results: CATEGORIES_FIXTURE, count: 1 } });
      }
      return Promise.resolve({
        data: { results: [], count: 0, normalized_query: 'xyznada' },
      });
    });
    renderAt('?q=xyznada');
    expect(
      await screen.findByText(/no encontramos productos/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /explora el catalogo completo/i })).toBeInTheDocument();
  });

  it('muestra estado de error si la API falla', async () => {
    apiService.get.mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/categories')) {
        return Promise.resolve({ data: { results: [], count: 0 } });
      }
      return Promise.reject(new Error('boom'));
    });
    renderAt('?q=oshun');
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
