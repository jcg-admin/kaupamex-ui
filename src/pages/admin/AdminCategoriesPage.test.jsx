/**
 * Tests — AdminCategoriesPage (UC-CAT-06)
 *
 *   GET   /api/v1/admin/categories/
 *   POST  /api/v1/admin/categories/
 *   PATCH /api/v1/admin/categories/:id/
 *   POST  /api/v1/admin/categories/:id/deactivate/
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

const BASE = process.env.API_URL || 'http://localhost:8000';

import categoriesReducer from '@redux/slices/categoriesSlice';
import AdminCategoriesPage from './AdminCategoriesPage';

const CATEGORIES = [
  { id: 1, name: 'Collares', is_active: true, parent: null },
  { id: 2, name: 'Pulseras', is_active: true, parent: null },
  { id: 3, name: 'Elekes',   is_active: false, parent: null },
];

const wrap = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const store = configureStore({ reducer: { categories: categoriesReducer } });
  return (
    <QueryClientProvider client={client}>
      <Provider store={store}>
        <MemoryRouter>
          <AdminCategoriesPage />
        </MemoryRouter>
      </Provider>
    </QueryClientProvider>
  );
};

describe('AdminCategoriesPage (UC-CAT-06)', () => {
  it('muestra el listado de categorias', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/categories/`, () => HttpResponse.json({ results: CATEGORIES })),
    );
    render(wrap());
    expect(
      await screen.findByRole('heading', { name: /Categorias/i, level: 1 }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('cell', { name: 'Collares' })).toBeInTheDocument();
  });

  it('crea una categoria via POST /api/v1/admin/categories/', async () => {
    let lastPostUrl;
    server.use(
      http.get(`${BASE}/api/v1/admin/categories/`, () => HttpResponse.json({ results: CATEGORIES })),
      http.post(`${BASE}/api/v1/admin/categories/`, async ({ request }) => {
        lastPostUrl = request.url;
        return HttpResponse.json({ id: 99, name: 'Nueva' });
      }),
    );

    render(wrap());
    await screen.findByRole('cell', { name: 'Collares' });

    fireEvent.change(screen.getByLabelText(/^Nombre/i),
      { target: { value: 'Nueva categoria' } });
    fireEvent.click(screen.getByRole('button', { name: /Crear categoria/i }));

    await waitFor(() => {
      expect(lastPostUrl).toContain('/api/v1/admin/categories/');
    });
  });

  it('valida nombre obligatorio antes de enviar', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/categories/`, () => HttpResponse.json({ results: CATEGORIES })),
    );
    render(wrap());
    await screen.findByRole('cell', { name: 'Collares' });

    fireEvent.click(screen.getByRole('button', { name: /Crear categoria/i }));
    expect(await screen.findByText(/El nombre es obligatorio/i)).toBeInTheDocument();
  });

  it('desactiva una categoria via POST /:id/deactivate/', async () => {
    let lastDeactivateUrl;
    server.use(
      http.get(`${BASE}/api/v1/admin/categories/`, () => HttpResponse.json({ results: CATEGORIES })),
      http.post(`${BASE}/api/v1/admin/categories/:id/deactivate/`, async ({ request }) => {
        lastDeactivateUrl = request.url;
        return HttpResponse.json({ ok: true });
      }),
    );

    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(wrap());
    await screen.findByRole('cell', { name: 'Collares' });

    const buttons = screen.getAllByRole('button', { name: /Desactivar/i });
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(lastDeactivateUrl).toContain('/deactivate/');
    });

    confirmSpy.mockRestore();
  });
});
