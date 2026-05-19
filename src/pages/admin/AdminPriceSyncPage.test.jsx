/**
 * Tests — AdminPriceSyncPage (UC-CAT-12).
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

import apiService from '@services/apiService';
import priceSyncReducer from '../../redux/slices/priceSyncSlice';
import AdminPriceSyncPage from './AdminPriceSyncPage';

const PREVIEW = {
  rows: [
    { sku: 'SKU-1', current_price: 100, new_price: 110, diff_pct: 10, status: 'valido' },
    { sku: 'SKU-2', current_price: 200, new_price: 0,   diff_pct: -100, status: 'invalido' },
  ],
  summary: { valid: 1, invalid: 1 },
  token: 'preview-token-abc',
};

const makeStore = () =>
  configureStore({ reducer: { priceSync: priceSyncReducer } });

const renderPage = () => render(
  <Provider store={makeStore()}>
    <MemoryRouter>
      <AdminPriceSyncPage />
    </MemoryRouter>
  </Provider>,
);

afterEach(() => jest.clearAllMocks());

describe('AdminPriceSyncPage (UC-CAT-12)', () => {
  it('muestra el titulo «Sincronizar precios» y las dos pestanas', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { name: /sincronizar precios/i, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /cargar csv/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /ajuste porcentual/i })).toBeInTheDocument();
  });

  it('CSV: previsualiza al cargar archivo y pulsar generar vista previa', async () => {
    apiService.post.mockResolvedValueOnce({ data: PREVIEW });
    renderPage();
    const fileInput = screen.getByLabelText(/archivo csv/i);
    const blob = new Blob(['sku,price\nSKU-1,110\n'], { type: 'text/csv' });
    const csv = new File([blob], 'precios.csv', { type: 'text/csv' });
    fireEvent.change(fileInput, { target: { files: [csv] } });
    fireEvent.click(screen.getByRole('button', { name: /generar vista previa/i }));
    expect(await screen.findByText('SKU-1')).toBeInTheDocument();
    expect(screen.getByText('SKU-2')).toBeInTheDocument();
    expect(apiService.post).toHaveBeenCalledWith(
      '/api/v1/admin/price-sync/preview-csv/',
      expect.any(FormData),
    );
  });

  it('CSV: confirma y aplica usando el token de la preview', async () => {
    apiService.post
      .mockResolvedValueOnce({ data: PREVIEW })
      .mockResolvedValueOnce({ data: { updated: 1, skipped: 1 } });
    renderPage();
    const fileInput = screen.getByLabelText(/archivo csv/i);
    const csv = new File(['sku,price'], 'p.csv', { type: 'text/csv' });
    fireEvent.change(fileInput, { target: { files: [csv] } });
    fireEvent.click(screen.getByRole('button', { name: /generar vista previa/i }));
    await screen.findByText('SKU-1');
    fireEvent.click(screen.getByRole('button', { name: /confirmar y aplicar/i }));
    await waitFor(() =>
      expect(apiService.post).toHaveBeenLastCalledWith(
        '/api/v1/admin/price-sync/apply-csv/',
        { token: 'preview-token-abc' },
      ),
    );
    expect(await screen.findByRole('status')).toHaveTextContent(/precios actualizados/i);
  });

  it('marca con clase de invalido las filas con status=invalido (EX-02)', async () => {
    apiService.post.mockResolvedValueOnce({ data: PREVIEW });
    renderPage();
    const csv = new File(['x'], 'x.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByLabelText(/archivo csv/i), { target: { files: [csv] } });
    fireEvent.click(screen.getByRole('button', { name: /generar vista previa/i }));
    await screen.findByText('SKU-2');
    expect(screen.getByText('invalido')).toBeInTheDocument();
  });

  it('porcentaje: envia percentage + filtros al backend (Alt A)', async () => {
    apiService.post.mockResolvedValueOnce({ data: PREVIEW });
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /ajuste porcentual/i }));
    fireEvent.change(screen.getByLabelText(/porcentaje de ajuste/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/categoria/i), { target: { value: 'collares' } });
    fireEvent.change(screen.getByLabelText(/precio actual minimo/i), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: /generar vista previa/i }));
    await waitFor(() =>
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/admin/price-sync/preview-percentage/',
        expect.objectContaining({
          percentage: 5, category: 'collares', price_min: 100,
        }),
      ),
    );
  });

  it('muestra error si la API de preview falla (EX-01)', async () => {
    apiService.post.mockRejectedValueOnce(new Error('csv invalido'));
    renderPage();
    const csv = new File(['bad'], 'b.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByLabelText(/archivo csv/i), { target: { files: [csv] } });
    fireEvent.click(screen.getByRole('button', { name: /generar vista previa/i }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
