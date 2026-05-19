/**
 * Tests — AdminInventoryMovementsPage
 * UC-INV-02: Decremento de stock (movimientos tipo SALE)
 * UC-INV-03: Restauración de stock (movimientos tipo CANCELLATION)
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import inventoryReducer from '@redux/slices/inventorySlice';
import AdminInventoryMovementsPage from './AdminInventoryMovementsPage';

const makeStore = () =>
  configureStore({ reducer: { inventory: inventoryReducer } });

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (store) => (
  <Provider store={store}>
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter initialEntries={['/admin/inventory/10/movements']}>
        <Routes>
          <Route path="/admin/inventory/:variantId/movements"
                 element={<AdminInventoryMovementsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  </Provider>
);

const MOVEMENTS = [
  { id: 1, type: 'SALE',         delta: -2, stock_after: 8,
    reference: 'ORD-100', created_at: '2026-05-01T10:00:00Z' },
  { id: 2, type: 'CANCELLATION', delta:  2, stock_after: 10,
    reference: 'ORD-100', created_at: '2026-05-02T10:00:00Z' },
  { id: 3, type: 'MANUAL',       delta: -1, stock_after: 9,
    reference: 'ADMIN:5', reason: 'MERMA',
    created_at: '2026-05-03T10:00:00Z' },
];

afterEach(() => jest.clearAllMocks());

describe('AdminInventoryMovementsPage (UC-INV-02 / UC-INV-03)', () => {
  it('muestra el titulo de la pagina de movimientos', async () => {
    apiService.get.mockResolvedValue({ data: { results: MOVEMENTS } });
    render(wrap(makeStore()));
    expect(
      await screen.findByRole('heading', { name: /Movimientos de inventario/i }),
    ).toBeInTheDocument();
  });

  it('UC-INV-02: muestra los movimientos tipo SALE (venta)', async () => {
    apiService.get.mockResolvedValue({ data: { results: MOVEMENTS } });
    render(wrap(makeStore()));
    expect(await screen.findByText('Venta')).toBeInTheDocument();
    // delta negativo formateado
    expect(await screen.findByText('-2')).toBeInTheDocument();
  });

  it('UC-INV-03: muestra los movimientos tipo CANCELLATION (cancelacion)', async () => {
    apiService.get.mockResolvedValue({ data: { results: MOVEMENTS } });
    render(wrap(makeStore()));
    expect(await screen.findByText(/Cancelaci[oó]n/i)).toBeInTheDocument();
    // delta positivo
    expect(await screen.findByText('+2')).toBeInTheDocument();
  });

  it('llama al endpoint de movimientos con el variantId de la URL', async () => {
    apiService.get.mockResolvedValue({ data: { results: [] } });
    render(wrap(makeStore()));
    await screen.findByText(/Sin movimientos/i);
    expect(apiService.get).toHaveBeenCalledWith(
      '/api/v1/admin/inventory/variants/10/movements/',
      expect.anything(),
    );
  });

  it('muestra estado vacio si la variante no tiene movimientos', async () => {
    apiService.get.mockResolvedValue({ data: { results: [] } });
    render(wrap(makeStore()));
    expect(
      await screen.findByText(/Sin movimientos registrados/i),
    ).toBeInTheDocument();
  });

  it('cada fila muestra la referencia (orden o admin)', async () => {
    apiService.get.mockResolvedValue({ data: { results: MOVEMENTS } });
    render(wrap(makeStore()));
    expect(await screen.findAllByText('ORD-100')).toHaveLength(2);
    expect(screen.getByText('ADMIN:5')).toBeInTheDocument();
  });

  // UC-INV-03 — filtro por tipo para ver solo cancelaciones
  it('UC-INV-03: filtra los movimientos por tipo (solo cancelaciones)', async () => {
    apiService.get.mockResolvedValue({ data: { results: MOVEMENTS } });
    render(wrap(makeStore()));
    await screen.findByText('Venta');

    fireEvent.change(screen.getByLabelText(/Filtrar por tipo/i),
      { target: { value: 'CANCELLATION' } });

    // La venta desaparece de la tabla; "Cancelación" sigue ahí
    const table = screen.getByRole('table');
    expect(table).not.toHaveTextContent('Venta');
    expect(table).toHaveTextContent('Cancelación');
  });
});
