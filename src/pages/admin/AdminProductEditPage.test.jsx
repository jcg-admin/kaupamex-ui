/**
 * Tests — AdminProductEditPage (UC-CAT-10 + UC-CAT-11)
 *
 *   GET   /api/v2/admin/products/:id/
 *   PATCH /api/v2/admin/products/:id/
 *   POST  /api/v2/admin/products/:id/deactivate/
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

const BASE = process.env.API_URL || 'http://localhost:8000';

import productsReducer from '@redux/slices/productsSlice';
import AdminProductEditPage from './AdminProductEditPage';

const PRODUCT = {
  id: 7,
  name: 'Collar Oshun',
  sku: 'OSHUN-001',
  short_description: 'corta',
  description: 'larga',
  base_price: '1250.00',
  stock: 8,
  // UC-CAT-13: la API (ProductAdminSerializer) devuelve `categories` (lista de
  // objetos), no `category` singular. EditPage hidrata desde categories[0].
  categories: [{ id: 1, name: 'Collares' }],
  status: 'PUBLICADO',
  is_active: true,
};

const CATEGORIES = [{ id: 1, name: 'Collares', is_active: true }];

const makeStore = () =>
  configureStore({ reducer: { products: productsReducer } });

const wrap = (store) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <Provider store={store}>
        <MemoryRouter initialEntries={['/admin/products/7/edit']}>
          <Routes>
            <Route path="/admin/products/:id/edit" element={<AdminProductEditPage />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    </QueryClientProvider>
  );
};

describe('AdminProductEditPage (UC-CAT-10)', () => {
  it('carga el producto desde /api/v1/admin/products/:id/', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/products/7/`, () => HttpResponse.json(PRODUCT)),
      http.get(`${BASE}/api/v1/admin/categories/`, () => HttpResponse.json({ results: CATEGORIES })),
    );
    render(wrap(makeStore()));
    expect(await screen.findByRole('heading', { name: /Editar Producto/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Collar Oshun')).toBeInTheDocument();
  });

  it('envia PATCH con los cambios al producto', async () => {
    let lastPatchUrl;
    let lastPatchBody;
    server.use(
      http.get(`${BASE}/api/v1/admin/products/7/`, () => HttpResponse.json(PRODUCT)),
      http.get(`${BASE}/api/v1/admin/categories/`, () => HttpResponse.json({ results: CATEGORIES })),
      http.patch(`${BASE}/api/v1/admin/products/7/`, async ({ request }) => {
        lastPatchUrl = request.url;
        lastPatchBody = await request.json().catch(() => null);
        return HttpResponse.json({ ...PRODUCT, name: 'Nuevo' });
      }),
    );

    render(wrap(makeStore()));
    const nameInput = await screen.findByDisplayValue('Collar Oshun');
    fireEvent.change(nameInput, { target: { value: 'Nuevo nombre' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    await waitFor(() => {
      expect(lastPatchUrl).toContain('/api/v1/admin/products/7/');
    });
    expect(lastPatchBody).toMatchObject({ name: 'Nuevo nombre' });
  });

  it('UC-CAT-11: desactiva el producto via POST /deactivate/', async () => {
    let lastDeactivateUrl;
    server.use(
      http.get(`${BASE}/api/v1/admin/products/7/`, () => HttpResponse.json(PRODUCT)),
      http.get(`${BASE}/api/v1/admin/categories/`, () => HttpResponse.json({ results: CATEGORIES })),
      http.post(`${BASE}/api/v1/admin/products/7/deactivate/`, async ({ request }) => {
        lastDeactivateUrl = request.url;
        return HttpResponse.json({ ok: true });
      }),
    );

    render(wrap(makeStore()));
    const btn = await screen.findByRole('button', { name: /Desactivar producto/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(lastDeactivateUrl).toContain('/api/v1/admin/products/7/deactivate/');
    });
  });
});
