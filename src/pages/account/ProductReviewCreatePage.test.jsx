/**
 * Tests — ProductReviewCreatePage
 * UC-REV-01: el comprador deja una resena de un producto comprado.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import reviewsReducer from '@redux/slices/reviewsSlice';
import ProductReviewCreatePage from './ProductReviewCreatePage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = () =>
  configureStore({ reducer: { reviews: reviewsReducer } });

const wrap = (path = '/account/orders/77/products/42/review') => (
  <Provider store={makeStore()}>
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/account/orders/:orderId/products/:productId/review"
          element={<ProductReviewCreatePage />}
        />
      </Routes>
    </MemoryRouter>
  </Provider>
);

describe('ProductReviewCreatePage (UC-REV-01)', () => {
  it('muestra el formulario con selector de estrellas', () => {
    render(wrap());
    expect(
      screen.getByRole('heading', { name: /Dejar rese[nñ]a/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /Calificaci[oó]n/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/T[ií]tulo/i)).toBeInTheDocument();
  });

  it('exige titulo y texto con longitud minima', () => {
    let postCalled = false;
    server.use(
      http.post(`${BASE}/api/v2/products/42/reviews/`, () => {
        postCalled = true;
        return HttpResponse.json({ id: 11, status: 'PENDING_MODERATION' });
      }),
    );

    render(wrap());
    fireEvent.click(screen.getByRole('button', { name: /Enviar rese[nñ]a/i }));
    expect(postCalled).toBe(false);
    expect(
      screen.getByText(/T[ií]tulo y texto son obligatorios/i),
    ).toBeInTheDocument();
  });

  it('al enviar, hace POST al endpoint con order_id y rating', async () => {
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v2/products/42/reviews/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({ id: 11, status: 'PENDING_MODERATION' });
      }),
    );

    render(wrap());

    fireEvent.click(screen.getByRole('button', { name: '5 de 5 estrellas' }));
    fireEvent.change(screen.getByLabelText(/T[ií]tulo/i), {
      target: { value: 'Excelente producto' },
    });
    fireEvent.change(screen.getByLabelText(/Texto/i), {
      target: { value: 'Cumple con lo prometido y mas. Gran calidad.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enviar rese[nñ]a/i }));

    await waitFor(() => {
      expect(lastBody).toMatchObject({
        order_id: 77,
        rating:   5,
        title:    'Excelente producto',
        body:     'Cumple con lo prometido y mas. Gran calidad.',
      });
    });
  });

  it('muestra confirmacion al recibir', async () => {
    server.use(
      http.post(`${BASE}/api/v2/products/42/reviews/`, async () => {
        return HttpResponse.json({ id: 11, status: 'PENDING_MODERATION' });
      }),
    );

    render(wrap());
    fireEvent.click(screen.getByRole('button', { name: '4 de 5 estrellas' }));
    fireEvent.change(screen.getByLabelText(/T[ií]tulo/i), {
      target: { value: 'Buen articulo' },
    });
    fireEvent.change(screen.getByLabelText(/Texto/i), {
      target: { value: 'Una resena suficientemente larga para pasar.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enviar rese[nñ]a/i }));
    expect(
      await screen.findByText(/Rese[nñ]a recibida/i),
    ).toBeInTheDocument();
  });
});
