/**
 * Tests — AdminInventoryAdjustPage
 * UC-INV-04: Ajustar stock manualmente.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import inventoryReducer from '@redux/slices/inventorySlice';
import AdminInventoryAdjustPage from './AdminInventoryAdjustPage';

const makeStore = () =>
  configureStore({ reducer: { inventory: inventoryReducer } });

const wrap = (store) => (
  <Provider store={store}>
    <MemoryRouter initialEntries={['/admin/inventory/10/adjust']}>
      <Routes>
        <Route path="/admin/inventory/:variantId/adjust"
               element={<AdminInventoryAdjustPage />} />
      </Routes>
    </MemoryRouter>
  </Provider>
);

afterEach(() => jest.clearAllMocks());

describe('AdminInventoryAdjustPage (UC-INV-04)', () => {
  it('muestra el formulario de ajuste con cantidad nueva y motivo', () => {
    render(wrap(makeStore()));
    expect(screen.getByRole('heading', { name: /Ajustar stock/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Cantidad nueva/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Motivo/i)).toBeInTheDocument();
  });

  it('motivo ofrece las opciones CONTEO_FISICO, MERMA, ROBO, DEVOLUCION, DESCONTINUADO, OTRO', () => {
    render(wrap(makeStore()));
    const select = screen.getByLabelText(/Motivo/i);
    expect(select.querySelectorAll('option')).toHaveLength(6);
    expect(select).toHaveTextContent(/Conteo f[ií]sico/i);
    expect(select).toHaveTextContent(/Merma/i);
    expect(select).toHaveTextContent(/Robo/i);
    expect(select).toHaveTextContent(/Devoluci[oó]n/i);
    expect(select).toHaveTextContent(/Descontinuado/i);
    expect(select).toHaveTextContent(/Otro/i);
  });

  it('al enviar, hace POST al endpoint /adjust con la nueva cantidad y motivo', async () => {
    apiService.post.mockResolvedValue({
      data: { variant_id: 10, previous_stock: 5, new_stock: 12, delta: 7, movement_id: 42 },
    });
    render(wrap(makeStore()));
    fireEvent.change(screen.getByLabelText(/Cantidad nueva/i),
      { target: { value: '12' } });
    fireEvent.change(screen.getByLabelText(/Motivo/i),
      { target: { value: 'CONTEO_FISICO' } });
    fireEvent.click(screen.getByRole('button', { name: /Aplicar ajuste/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/admin/inventory/variants/10/adjust/',
        expect.objectContaining({
          new_quantity: 12,
          reason: 'CONTEO_FISICO',
        }),
      );
    });
  });

  it('muestra un mensaje de exito tras un ajuste correcto', async () => {
    apiService.post.mockResolvedValue({
      data: { variant_id: 10, previous_stock: 5, new_stock: 12, delta: 7, movement_id: 42 },
    });
    render(wrap(makeStore()));
    fireEvent.change(screen.getByLabelText(/Cantidad nueva/i),
      { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: /Aplicar ajuste/i }));
    expect(
      await screen.findByText(/Stock ajustado correctamente/i),
    ).toBeInTheDocument();
  });

  it('muestra error si el backend rechaza con STOCK_NEGATIVO_NO_PERMITIDO', async () => {
    apiService.post.mockRejectedValue({
      body: { detail: 'STOCK_NEGATIVO_NO_PERMITIDO' }, message: '422',
    });
    render(wrap(makeStore()));
    fireEvent.change(screen.getByLabelText(/Cantidad nueva/i),
      { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: /Aplicar ajuste/i }));
    expect(
      await screen.findByText(/STOCK_NEGATIVO_NO_PERMITIDO/i),
    ).toBeInTheDocument();
  });

  it('valida en cliente que la cantidad sea >= 0 antes de enviar', () => {
    render(wrap(makeStore()));
    const input = screen.getByLabelText(/Cantidad nueva/i);
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('type', 'number');
  });

  it('enlace para volver al inventario', () => {
    render(wrap(makeStore()));
    expect(screen.getByRole('link', { name: /Volver al inventario/i })).toBeInTheDocument();
  });
});
