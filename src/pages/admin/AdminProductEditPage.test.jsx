/**
 * Tests — AdminProductEditPage (UC-CAT-10 + UC-CAT-11)
 *
 *   GET   /api/v1/admin/products/:id/
 *   PATCH /api/v1/admin/products/:id/
 *   POST  /api/v1/admin/products/:id/deactivate/
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

import apiService from '@services/apiService';
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
  category: { id: 1, name: 'Collares' },
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

afterEach(() => jest.clearAllMocks());

describe('AdminProductEditPage (UC-CAT-10)', () => {
  it('carga el producto desde /api/v1/admin/products/:id/', async () => {
    apiService.get.mockImplementation((url) => {
      if (url === '/api/v1/admin/products/7/') return Promise.resolve({ data: PRODUCT });
      return Promise.resolve({ data: { results: CATEGORIES } });
    });
    render(wrap(makeStore()));
    expect(await screen.findByRole('heading', { name: /Editar Producto/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Collar Oshun')).toBeInTheDocument();
  });

  it('envia PATCH con los cambios al producto', async () => {
    apiService.get.mockImplementation((url) => {
      if (url === '/api/v1/admin/products/7/') return Promise.resolve({ data: PRODUCT });
      return Promise.resolve({ data: { results: CATEGORIES } });
    });
    apiService.patch.mockResolvedValue({ data: { ...PRODUCT, name: 'Nuevo' } });

    render(wrap(makeStore()));
    const nameInput = await screen.findByDisplayValue('Collar Oshun');
    fireEvent.change(nameInput, { target: { value: 'Nuevo nombre' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    await waitFor(() => {
      expect(apiService.patch).toHaveBeenCalledWith(
        '/api/v1/admin/products/7/',
        expect.objectContaining({ name: 'Nuevo nombre' }),
      );
    });
  });

  it('UC-CAT-11: desactiva el producto via POST /deactivate/', async () => {
    apiService.get.mockImplementation((url) => {
      if (url === '/api/v1/admin/products/7/') return Promise.resolve({ data: PRODUCT });
      return Promise.resolve({ data: { results: CATEGORIES } });
    });
    apiService.post.mockResolvedValue({ data: { ok: true } });

    render(wrap(makeStore()));
    const btn = await screen.findByRole('button', { name: /Desactivar producto/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/admin/products/7/deactivate/',
      );
    });
  });
});
