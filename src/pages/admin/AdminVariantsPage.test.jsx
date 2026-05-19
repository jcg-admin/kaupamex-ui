/**
 * Tests — AdminVariantsPage
 * UC-CHT-03: Gestionar Variantes de Producto (Admin).
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: {
    get: jest.fn(), post: jest.fn(), patch: jest.fn(),
    put: jest.fn(), delete: jest.fn(),
  },
}));

import apiService from '@services/apiService';
import yorubaVariantsReducer from '@redux/slices/yorubaVariantsSlice';
import AdminVariantsPage from './AdminVariantsPage';

const makeStore = () =>
  configureStore({ reducer: { yorubaVariants: yorubaVariantsReducer } });

const wrap = (productId, store) => (
  <Provider store={store}>
    <MemoryRouter initialEntries={[`/admin/products/${productId}/variants`]}>
      <Routes>
        <Route
          path="/admin/products/:productId/variants"
          element={<AdminVariantsPage />}
        />
      </Routes>
    </MemoryRouter>
  </Provider>
);

const VARIANTS = [
  { id: 1, variant_type: 'Tamano', option_name: 'Chico',  stock: 10, price: null, is_active: true  },
  { id: 2, variant_type: 'Tamano', option_name: 'Grande', stock: 0,  price: 1800, is_active: false },
];

afterEach(() => jest.clearAllMocks());

describe('AdminVariantsPage (UC-CHT-03)', () => {
  it('muestra el titulo del panel de variantes', async () => {
    apiService.get.mockResolvedValue({ data: { results: VARIANTS } });
    render(wrap(7, makeStore()));
    expect(
      await screen.findByRole('heading', { name: /Variantes del producto/i }),
    ).toBeInTheDocument();
  });

  it('renderiza una fila por cada variante con tipo, opcion y stock', async () => {
    apiService.get.mockResolvedValue({ data: { results: VARIANTS } });
    render(wrap(7, makeStore()));
    expect(await screen.findByText('Chico')).toBeInTheDocument();
    expect(screen.getByText('Grande')).toBeInTheDocument();
    expect(screen.getAllByText('Tamano').length).toBeGreaterThan(0);
  });

  it('muestra estado vacio si no hay variantes', async () => {
    apiService.get.mockResolvedValue({ data: { results: [] } });
    render(wrap(7, makeStore()));
    expect(
      await screen.findByText(/No hay variantes configuradas/i),
    ).toBeInTheDocument();
  });

  it('permite crear una variante nueva enviando los datos al API', async () => {
    apiService.get.mockResolvedValue({ data: { results: [] } });
    apiService.post.mockResolvedValue({
      data: { id: 99, variant_type: 'Tamano', option_name: 'Mediano',
              stock: 5, price: null, is_active: true },
    });
    render(wrap(7, makeStore()));
    await screen.findByText(/No hay variantes configuradas/i);

    fireEvent.change(screen.getByLabelText(/Tipo de variante/i),
      { target: { value: 'Tamano' } });
    fireEvent.change(screen.getByLabelText(/Opcion/i),
      { target: { value: 'Mediano' } });
    fireEvent.change(screen.getByLabelText(/Stock inicial/i),
      { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /Crear variante/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/admin/products/7/variants/',
        expect.objectContaining({
          variant_type:  'Tamano',
          option_name:   'Mediano',
          initial_stock: 5,
        }),
      );
    });
  });

  it('permite alternar activo/inactivo en una variante existente', async () => {
    apiService.get.mockResolvedValue({ data: { results: VARIANTS } });
    apiService.patch.mockResolvedValue({
      data: { ...VARIANTS[0], is_active: false },
    });
    render(wrap(7, makeStore()));
    await screen.findByText('Chico');

    const toggleBtns = screen.getAllByRole('button', { name: /Desactivar|Activar/i });
    fireEvent.click(toggleBtns[0]);

    await waitFor(() => {
      expect(apiService.patch).toHaveBeenCalledWith(
        '/api/v1/admin/products/7/variants/1/',
        expect.objectContaining({ is_active: false }),
      );
    });
  });

  it('marca como Inactiva una variante con is_active=false', async () => {
    apiService.get.mockResolvedValue({ data: { results: VARIANTS } });
    render(wrap(7, makeStore()));
    await screen.findByText('Grande');
    expect(screen.getByText(/Inactiva/i)).toBeInTheDocument();
  });

  it('cada fila enlaza a la pagina de precio diferenciado', async () => {
    apiService.get.mockResolvedValue({ data: { results: VARIANTS } });
    render(wrap(7, makeStore()));
    const priceLinks = await screen.findAllByRole('link', { name: /Precio/i });
    expect(priceLinks[0]).toHaveAttribute('href', '/admin/variants/1/price');
    expect(priceLinks[1]).toHaveAttribute('href', '/admin/variants/2/price');
  });
});
