/**
 * Tests — AdminInventoryAdjustPage
 * UC-INV-04: Ajustar stock manualmente.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

const BASE = process.env.API_URL || 'http://localhost:8000';

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

describe('AdminInventoryAdjustPage (UC-INV-04)', () => {
  it('muestra el formulario de ajuste con cantidad nueva y motivo', () => {
    render(wrap(makeStore()));
    expect(screen.getByRole('heading', { name: /Ajustar stock/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Cantidad nueva/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Motivo/i)).toBeInTheDocument();
  });

  it('motivo ofrece las opciones PHYSICAL_COUNT, LOSS, THEFT, RETURN, DISCONTINUED, OTHER', () => {
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
    let lastPostUrl;
    let lastPostBody;
    server.use(
      http.post(`${BASE}/api/v1/admin/inventory/variants/10/adjust/`, async ({ request }) => {
        lastPostUrl = request.url;
        lastPostBody = await request.json().catch(() => null);
        return HttpResponse.json({
          variant_id: 10, previous_stock: 5, new_stock: 12, delta: 7, movement_id: 42,
        });
      }),
    );
    render(wrap(makeStore()));
    fireEvent.change(screen.getByLabelText(/Cantidad nueva/i),
      { target: { value: '12' } });
    fireEvent.change(screen.getByLabelText(/Motivo/i),
      { target: { value: 'PHYSICAL_COUNT' } });
    fireEvent.click(screen.getByRole('button', { name: /Aplicar ajuste/i }));

    await waitFor(() => {
      expect(lastPostUrl).toContain('/api/v1/admin/inventory/variants/10/adjust/');
    });
    expect(lastPostBody).toMatchObject({
      new_quantity: 12,
      reason: 'PHYSICAL_COUNT',
    });
  });

  it('muestra un mensaje de exito tras un ajuste correcto', async () => {
    server.use(
      http.post(`${BASE}/api/v1/admin/inventory/variants/10/adjust/`, () =>
        HttpResponse.json({
          variant_id: 10, previous_stock: 5, new_stock: 12, delta: 7, movement_id: 42,
        }),
      ),
    );
    render(wrap(makeStore()));
    fireEvent.change(screen.getByLabelText(/Cantidad nueva/i),
      { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: /Aplicar ajuste/i }));
    expect(
      await screen.findByText(/Stock ajustado correctamente/i),
    ).toBeInTheDocument();
  });

  it('muestra error si el backend rechaza con STOCK_NEGATIVO_NO_PERMITIDO', async () => {
    server.use(
      http.post(`${BASE}/api/v1/admin/inventory/variants/10/adjust/`, () =>
        HttpResponse.json(
          { detail: 'NEGATIVE_STOCK_NOT_ALLOWED' },
          { status: 422 },
        ),
      ),
    );
    render(wrap(makeStore()));
    fireEvent.change(screen.getByLabelText(/Cantidad nueva/i),
      { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: /Aplicar ajuste/i }));
    expect(
      await screen.findByText(/NEGATIVE_STOCK_NOT_ALLOWED/i),
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
