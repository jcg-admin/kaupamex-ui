/**
 * Tests — ProductDiscountCreateForm
 * UC-DASH-01: Crear descuento de producto
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }       from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import productDiscountsReducer from '@redux/slices/productDiscountsSlice';
import ProductDiscountCreateForm from './ProductDiscountCreateForm';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = () =>
  configureStore({ reducer: { productDiscounts: productDiscountsReducer } });

const wrap = (ui, store) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={client}>
      <Provider store={store}>{ui}</Provider>
    </QueryClientProvider>
  );
};

describe('ProductDiscountCreateForm (UC-DASH-01)', () => {
  it('renderiza los campos requeridos del formulario', () => {
    render(wrap(<ProductDiscountCreateForm onClose={() => {}} />, makeStore()));
    expect(screen.getByLabelText(/ID del producto/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Porcentaje/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Vigente desde/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Vigente hasta/i)).toBeInTheDocument();
  });

  it('muestra error de validacion si el porcentaje esta fuera de rango', async () => {
    render(wrap(<ProductDiscountCreateForm onClose={() => {}} />, makeStore()));

    fireEvent.change(screen.getByLabelText(/ID del producto/i), {
      target: { value: '10' },
    });
    fireEvent.change(screen.getByLabelText(/Porcentaje/i), {
      target: { value: '150' },
    });
    fireEvent.change(screen.getByLabelText(/Vigente desde/i), {
      target: { value: '2026-06-01' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Crear descuento/i }));

    expect(
      await screen.findByText(/entre 1(\.0+)? y 99\.99/i),
    ).toBeInTheDocument();
  });

  it('envia el payload con keys en ingles al confirmar', async () => {
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v1/admin/product-discounts/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({ id: 99, product_id: 10, discount_pct: 15.0 }, { status: 201 });
      }),
    );

    const onClose = jest.fn();
    render(wrap(<ProductDiscountCreateForm onClose={onClose} />, makeStore()));

    fireEvent.change(screen.getByLabelText(/ID del producto/i), {
      target: { value: '10' },
    });
    fireEvent.change(screen.getByLabelText(/Porcentaje/i), {
      target: { value: '15' },
    });
    fireEvent.change(screen.getByLabelText(/Vigente desde/i), {
      target: { value: '2026-06-01' },
    });
    fireEvent.change(screen.getByLabelText(/Vigente hasta/i), {
      target: { value: '2026-12-31' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Crear descuento/i }));

    await waitFor(() => {
      expect(lastBody).toMatchObject({
        product_id:   10,
        discount_pct: 15,
        valid_from:   '2026-06-01',
        valid_until:  '2026-12-31',
      });
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('acepta valid_until vacio (sin vencimiento)', async () => {
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v1/admin/product-discounts/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({ id: 99, product_id: 10, discount_pct: 15.0 }, { status: 201 });
      }),
    );

    render(wrap(<ProductDiscountCreateForm onClose={() => {}} />, makeStore()));

    fireEvent.change(screen.getByLabelText(/ID del producto/i), {
      target: { value: '10' },
    });
    fireEvent.change(screen.getByLabelText(/Porcentaje/i), {
      target: { value: '20' },
    });
    fireEvent.change(screen.getByLabelText(/Vigente desde/i), {
      target: { value: '2026-06-01' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Crear descuento/i }));

    await waitFor(() => {
      expect(lastBody).toMatchObject({ valid_until: null });
    });
  });

  it('muestra mensaje de error 409 cuando ya hay descuento activo', async () => {
    server.use(
      http.post(`${BASE}/api/v1/admin/product-discounts/`, () =>
        HttpResponse.json(
          { message: 'Ya existe descuento activo para este producto', codigo_error: 'DISCOUNT_ALREADY_ACTIVE' },
          { status: 409 },
        ),
      ),
    );

    render(wrap(<ProductDiscountCreateForm onClose={() => {}} />, makeStore()));

    fireEvent.change(screen.getByLabelText(/ID del producto/i), {
      target: { value: '10' },
    });
    fireEvent.change(screen.getByLabelText(/Porcentaje/i), {
      target: { value: '15' },
    });
    fireEvent.change(screen.getByLabelText(/Vigente desde/i), {
      target: { value: '2026-06-01' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Crear descuento/i }));

    expect(
      await screen.findByText(/Ya existe descuento|descuento activo/i),
    ).toBeInTheDocument();
  });
});
