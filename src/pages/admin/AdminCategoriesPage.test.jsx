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

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

import apiService from '@services/apiService';
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

afterEach(() => jest.clearAllMocks());

describe('AdminCategoriesPage (UC-CAT-06)', () => {
  it('muestra el listado de categorias', async () => {
    apiService.get.mockResolvedValue({ data: { results: CATEGORIES } });
    render(wrap());
    expect(
      await screen.findByRole('heading', { name: /Categorias/i, level: 1 }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('cell', { name: 'Collares' })).toBeInTheDocument();
  });

  it('crea una categoria via POST /api/v1/admin/categories/', async () => {
    apiService.get.mockResolvedValue({ data: { results: CATEGORIES } });
    apiService.post.mockResolvedValue({ data: { id: 99, name: 'Nueva' } });

    render(wrap());
    await screen.findByRole('cell', { name: 'Collares' });

    fireEvent.change(screen.getByLabelText(/^Nombre/i),
      { target: { value: 'Nueva categoria' } });
    fireEvent.click(screen.getByRole('button', { name: /Crear categoria/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/admin/categories/',
        expect.objectContaining({ name: 'Nueva categoria' }),
      );
    });
  });

  it('valida nombre obligatorio antes de enviar', async () => {
    apiService.get.mockResolvedValue({ data: { results: CATEGORIES } });
    render(wrap());
    await screen.findByRole('cell', { name: 'Collares' });

    fireEvent.click(screen.getByRole('button', { name: /Crear categoria/i }));
    expect(await screen.findByText(/El nombre es obligatorio/i)).toBeInTheDocument();
    expect(apiService.post).not.toHaveBeenCalled();
  });

  it('desactiva una categoria via POST /:id/deactivate/', async () => {
    apiService.get.mockResolvedValue({ data: { results: CATEGORIES } });
    apiService.post.mockResolvedValue({ data: { ok: true } });

    render(wrap());
    await screen.findByRole('cell', { name: 'Collares' });

    const buttons = screen.getAllByRole('button', { name: /Desactivar/i });
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/admin/categories/1/deactivate/',
      );
    });
  });
});
