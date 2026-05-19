/**
 * Tests — AdminVariantPricePage
 * UC-CHT-04: Configurar Precio Diferenciado por Variante (Admin).
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
import AdminVariantPricePage from './AdminVariantPricePage';

const makeStore = () =>
  configureStore({ reducer: { yorubaVariants: yorubaVariantsReducer } });

const wrap = (variantId, store) => (
  <Provider store={store}>
    <MemoryRouter initialEntries={[`/admin/variants/${variantId}/price`]}>
      <Routes>
        <Route
          path="/admin/variants/:variantId/price"
          element={<AdminVariantPricePage />}
        />
      </Routes>
    </MemoryRouter>
  </Provider>
);

afterEach(() => jest.clearAllMocks());

describe('AdminVariantPricePage (UC-CHT-04)', () => {
  it('muestra el titulo de la pagina', () => {
    render(wrap(1, makeStore()));
    expect(
      screen.getByRole('heading', { name: /Precio diferenciado/i }),
    ).toBeInTheDocument();
  });

  it('envia el precio al API al confirmar', async () => {
    apiService.put.mockResolvedValue({
      data: { id: 1, price: 1999.00 },
    });
    render(wrap(1, makeStore()));

    fireEvent.change(screen.getByLabelText(/Precio sin IVA/i),
      { target: { value: '1999' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar precio/i }));

    await waitFor(() => {
      expect(apiService.put).toHaveBeenCalledWith(
        '/api/v1/admin/variants/1/price/',
        expect.objectContaining({ price: 1999 }),
      );
    });
  });

  it('valida que el precio sea positivo y bloquea negativos', async () => {
    render(wrap(1, makeStore()));
    fireEvent.change(screen.getByLabelText(/Precio sin IVA/i),
      { target: { value: '-10' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar precio/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /precio debe ser/i,
    );
    expect(apiService.put).not.toHaveBeenCalled();
  });

  it('valida que el precio no este vacio', async () => {
    render(wrap(1, makeStore()));
    fireEvent.click(screen.getByRole('button', { name: /Guardar precio/i }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(apiService.put).not.toHaveBeenCalled();
  });

  it('permite quitar el precio diferenciado (volver al precio base)', async () => {
    apiService.delete.mockResolvedValue({ data: { id: 1, price: null } });
    render(wrap(1, makeStore()));

    fireEvent.click(screen.getByRole('button', { name: /Quitar precio diferenciado/i }));

    await waitFor(() => {
      expect(apiService.delete).toHaveBeenCalledWith(
        '/api/v1/admin/variants/1/price/',
      );
    });
  });

  it('muestra mensaje de exito cuando el guardado es correcto', async () => {
    apiService.put.mockResolvedValue({ data: { id: 1, price: 500 } });
    render(wrap(1, makeStore()));

    fireEvent.change(screen.getByLabelText(/Precio sin IVA/i),
      { target: { value: '500' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar precio/i }));

    expect(
      await screen.findByText(/precio actualizado/i),
    ).toBeInTheDocument();
  });

  it('permite precio cero (variante gratuita) — Alternativa C', async () => {
    apiService.put.mockResolvedValue({ data: { id: 1, price: 0 } });
    render(wrap(1, makeStore()));

    fireEvent.change(screen.getByLabelText(/Precio sin IVA/i),
      { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar precio/i }));

    await waitFor(() => {
      expect(apiService.put).toHaveBeenCalledWith(
        '/api/v1/admin/variants/1/price/',
        expect.objectContaining({ price: 0 }),
      );
    });
  });
});
