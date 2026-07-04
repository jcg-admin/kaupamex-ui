/**
 * Tests — SearchResultsPage (UC-CAT-03 + UC-CAT-03-EXT).
 *
 * SearchResultsPage renders ProductCard components which use Redux (useDispatch,
 * useSelector). A Redux Provider is required even though the page itself
 * does not use Redux directly.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';
import cartReducer from '@redux/slices/cartSlice';
import SearchResultsPage from './SearchResultsPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = () =>
  configureStore({
    reducer: {
      cart: cartReducer,
      auth: (state = { isAuthenticated: false }) => state,
    },
  });

const PRODUCT_A = {
  id: 1, name: 'Collar Oshun', slug: 'collar-oshun',
  sku: 'OSH-001', base_price: '1200.00', price_with_tax: 1392,
  stock: 5, category_name: 'Collares', highlighted_name: 'Collar <mark>Oshun</mark>',
};

const renderAt = (search = '?q=oshun') => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <Provider store={makeStore()}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[`/search${search}`]}>
          <Routes>
            <Route path="/search" element={<SearchResultsPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
};

const CATEGORIES_FIXTURE = [
  { id: 1, slug: 'collares', name: 'Collares', product_count: 5, children: [] },
];

beforeEach(() => {
  server.use(
    http.get(`${BASE}/api/v2/categories/`, () =>
      HttpResponse.json({ results: CATEGORIES_FIXTURE, count: 1 }),
    ),
    http.get(`${BASE}/api/v2/products/`, () =>
      HttpResponse.json({
        results: [PRODUCT_A], count: 1, active_filters: {}, normalized_query: 'oshun',
      }),
    ),
  );
});

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

  it('llama a /api/v2/products/ con el termino normalizado', async () => {
    let capturedUrl;
    server.use(
      http.get(`${BASE}/api/v2/products/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({
          results: [PRODUCT_A], count: 1, active_filters: {}, normalized_query: 'oshun',
        });
      }),
    );
    renderAt('?q=oshun');
    await waitFor(() => {
      expect(capturedUrl).toBeDefined();
      expect(new URL(capturedUrl).searchParams.get('q')).toBe('oshun');
    });
  });

  it('reenvia los filtros (category, price_min, price_max) a la API (UC-CAT-03-EXT)', async () => {
    let capturedUrl;
    server.use(
      http.get(`${BASE}/api/v2/products/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({
          results: [PRODUCT_A], count: 1, active_filters: {}, normalized_query: 'oshun',
        });
      }),
    );
    renderAt('?q=oshun&category=collares&price_min=100&price_max=500');
    await waitFor(() => {
      expect(capturedUrl).toBeDefined();
      const params = new URL(capturedUrl).searchParams;
      expect(params.get('q')).toBe('oshun');
      expect(params.get('category')).toBe('collares');
      expect(params.get('price_min')).toBe('100');
      expect(params.get('price_max')).toBe('500');
    });
  });

  it('no consulta la API cuando el termino es demasiado corto (Alt C)', async () => {
    let searchCalled = false;
    server.use(
      http.get(`${BASE}/api/v2/products/`, () => {
        searchCalled = true;
        return HttpResponse.json({ results: [], count: 0 });
      }),
    );
    renderAt('?q=a');
    expect(
      await screen.findByText(/al menos 2 caracteres/i),
    ).toBeInTheDocument();
    expect(searchCalled).toBe(false);
  });

  it('muestra estado «sin resultados» con sugerencias accionables (Alt A)', async () => {
    server.use(
      http.get(`${BASE}/api/v2/products/`, () =>
        HttpResponse.json({ results: [], count: 0, normalized_query: 'xyznada' }),
      ),
    );
    renderAt('?q=xyznada');
    expect(
      await screen.findByText(/no encontramos productos/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /explora el catálogo completo/i })).toBeInTheDocument();
  });

  it('muestra estado de error si la API falla', async () => {
    server.use(
      http.get(`${BASE}/api/v2/products/`, () =>
        HttpResponse.json({ detail: 'Error' }, { status: 400 }),
      ),
    );
    renderAt('?q=oshun');
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
