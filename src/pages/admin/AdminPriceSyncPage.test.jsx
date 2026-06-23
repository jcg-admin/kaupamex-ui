/**
 * Tests — AdminPriceSyncPage (UC-CAT-12).
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import priceSyncReducer from '../../redux/slices/priceSyncSlice';
import AdminPriceSyncPage from './AdminPriceSyncPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

// H-CICLO70-01: API shape es { session_id, preview: [...], valid_count, invalid_count }
const PREVIEW = {
  session_id:    'preview-session-abc',
  preview: [
    { sku: 'SKU-1', old_price: 100, new_price: 110, diff_pct: 10,   product_name: 'Collar 1' },
    { sku: 'SKU-2', old_price: 200, new_price: 0,   diff_pct: -100, product_name: 'Collar 2' },
  ],
  valid_count:   1,
  invalid_count: 1,
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
    let handlerCalled = false;
    server.use(
      http.post(`${BASE}/api/v1/admin/price-sync/preview-csv/`, () => {
        handlerCalled = true;
        return HttpResponse.json(PREVIEW);
      }),
    );
    renderPage();
    const fileInput = screen.getByLabelText(/archivo csv/i);
    const blob = new Blob(['sku,price\nSKU-1,110\n'], { type: 'text/csv' });
    const csv = new File([blob], 'precios.csv', { type: 'text/csv' });
    fireEvent.change(fileInput, { target: { files: [csv] } });
    fireEvent.click(screen.getByRole('button', { name: /generar vista previa/i }));
    expect(await screen.findByText('SKU-1')).toBeInTheDocument();
    expect(screen.getByText('SKU-2')).toBeInTheDocument();
    await waitFor(() => expect(handlerCalled).toBe(true));
  });

  it('CSV: confirma y aplica usando el token de la preview', async () => {
    let applyBody;
    server.use(
      http.post(`${BASE}/api/v1/admin/price-sync/preview-csv/`, () =>
        HttpResponse.json(PREVIEW),
      ),
      http.post(`${BASE}/api/v1/admin/price-sync/apply-csv/`, async ({ request }) => {
        applyBody = await request.json();
        return HttpResponse.json({ updated: 1, skipped: 1 });
      }),
    );
    renderPage();
    const fileInput = screen.getByLabelText(/archivo csv/i);
    const csv = new File(['sku,price'], 'p.csv', { type: 'text/csv' });
    fireEvent.change(fileInput, { target: { files: [csv] } });
    fireEvent.click(screen.getByRole('button', { name: /generar vista previa/i }));
    await screen.findByText('SKU-1');
    fireEvent.click(screen.getByRole('button', { name: /confirmar y aplicar/i }));
    await waitFor(() =>
      expect(applyBody).toMatchObject({ session_id: 'preview-session-abc' }),
    );
    expect(await screen.findByRole('status')).toHaveTextContent(/precios actualizados/i);
  });

  it('muestra conteo de filas invalidas en el resumen (EX-02)', async () => {
    // H-CICLO70-01: el componente muestra el conteo via invalid_count en el
    // resumen; no renderiza la columna "status" por fila (filas del preview
    // son siempre validas en la nueva API).
    server.use(
      http.post(`${BASE}/api/v1/admin/price-sync/preview-csv/`, () =>
        HttpResponse.json(PREVIEW),
      ),
    );
    renderPage();
    const csv = new File(['x'], 'x.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByLabelText(/archivo csv/i), { target: { files: [csv] } });
    fireEvent.click(screen.getByRole('button', { name: /generar vista previa/i }));
    await screen.findByText('SKU-2');
    expect(screen.getByText(/invalidas/i)).toBeInTheDocument();
  });

  it('porcentaje: envia percentage + filtros al backend (Alt A)', async () => {
    let lastPostBody;
    server.use(
      http.post(`${BASE}/api/v1/admin/price-sync/preview-percentage/`, async ({ request }) => {
        lastPostBody = await request.json();
        return HttpResponse.json(PREVIEW);
      }),
    );
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /ajuste porcentual/i }));
    fireEvent.change(screen.getByLabelText(/porcentaje de ajuste/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/categoria/i), { target: { value: 'collares' } });
    fireEvent.change(screen.getByLabelText(/precio actual minimo/i), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: /generar vista previa/i }));
    await waitFor(() =>
      expect(lastPostBody).toMatchObject({
        pct: 5, category_id: 'collares', price_min: 100,
      }),
    );
  });

  it('muestra error si la API de preview falla (EX-01)', async () => {
    server.use(
      http.post(`${BASE}/api/v1/admin/price-sync/preview-csv/`, () =>
        HttpResponse.json({ detail: 'csv invalido' }, { status: 400 }),
      ),
    );
    renderPage();
    const csv = new File(['bad'], 'b.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByLabelText(/archivo csv/i), { target: { files: [csv] } });
    fireEvent.click(screen.getByRole('button', { name: /generar vista previa/i }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
