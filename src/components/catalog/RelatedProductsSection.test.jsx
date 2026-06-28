/**
 * Tests — RelatedProductsSection (UC-CAT-07).
 *
 * RelatedProductsSection renders ProductCard components which use Redux
 * (useDispatch, useSelector for auth and wishlist).
 * A Redux Provider is required.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import cartReducer from '@redux/slices/cartSlice';
import RelatedProductsSection from './RelatedProductsSection';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = () =>
  configureStore({
    reducer: {
      cart: cartReducer,
      auth: (state = { isAuthenticated: false }) => state,
    },
  });

const P1 = {
  id: 11, name: 'Pulsera Yemaya', slug: 'pulsera-yemaya',
  sku: 'PUY-001', base_price: 200, price_with_tax: 232, stock: 5,
  category_name: 'Pulseras', highlighted_name: 'Pulsera Yemaya',
};
const P2 = {
  id: 12, name: 'Collar Oshun', slug: 'collar-oshun',
  sku: 'COO-001', base_price: 300, price_with_tax: 348, stock: 1,
  category_name: 'Collares', highlighted_name: 'Collar Oshun',
};

const renderSection = (slug = 'producto-base') => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <Provider store={makeStore()}>
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <RelatedProductsSection slug={slug} />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
};

describe('RelatedProductsSection (UC-CAT-07)', () => {
  it('llama a GET /api/v2/products/:slug/related/', async () => {
    let called = false;
    server.use(
      http.get(`${BASE}/api/v2/products/mi-producto/related/`, () => {
        called = true;
        return HttpResponse.json({ results: [], fallback: null });
      }),
    );
    renderSection('mi-producto');
    await waitFor(() => expect(called).toBe(true));
  });

  it('renderiza productos relacionados con titulo "Productos relacionados"', async () => {
    server.use(
      http.get(`${BASE}/api/v2/products/producto-base/related/`, () =>
        HttpResponse.json({ results: [P1, P2], fallback: 'category' }),
      ),
    );
    renderSection();
    expect(await screen.findByText('Pulsera Yemaya')).toBeInTheDocument();
    expect(screen.getByText('Collar Oshun')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /^productos relacionados$/i, level: 2 }),
    ).toBeInTheDocument();
  });

  it('usa titulo "Tambien te puede interesar" cuando fallback es recent', async () => {
    server.use(
      http.get(`${BASE}/api/v2/products/producto-base/related/`, () =>
        HttpResponse.json({ results: [P1], fallback: 'recent' }),
      ),
    );
    renderSection();
    expect(
      await screen.findByRole('heading', { name: /tambien te puede interesar/i }),
    ).toBeInTheDocument();
  });

  it('oculta la seccion cuando no hay resultados (Alt A)', async () => {
    server.use(
      http.get(`${BASE}/api/v2/products/producto-base/related/`, () =>
        HttpResponse.json({ results: [], fallback: 'category' }),
      ),
    );
    const { container } = renderSection();
    await waitFor(() => expect(container.querySelector('section')).toBeNull());
  });

  it('oculta la seccion silenciosamente cuando la API falla (EX-01/EX-02)', async () => {
    // Use 400 (not 500) — 500 is in RETRYABLE_STATUS and apiService retries 3×
    server.use(
      http.get(`${BASE}/api/v2/products/producto-base/related/`, () =>
        HttpResponse.json({ detail: 'Error' }, { status: 400 }),
      ),
    );
    const { container } = renderSection();
    await waitFor(() => expect(container.querySelector('section')).toBeNull());
  });
});
