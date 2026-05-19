/**
 * Tests — ProductReviewCreatePage
 * UC-REV-01: el comprador deja una resena de un producto comprado.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import reviewsReducer from '@redux/slices/reviewsSlice';
import ProductReviewCreatePage from './ProductReviewCreatePage';

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

afterEach(() => jest.clearAllMocks());

describe('ProductReviewCreatePage (UC-REV-01)', () => {
  it('muestra el formulario con selector de estrellas', () => {
    render(wrap());
    expect(
      screen.getByRole('heading', { name: /Dejar rese[nñ]a/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Calificaci[oó]n/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/T[ií]tulo/i)).toBeInTheDocument();
  });

  it('exige titulo y texto con longitud minima', () => {
    render(wrap());
    fireEvent.click(screen.getByRole('button', { name: /Enviar rese[nñ]a/i }));
    expect(apiService.post).not.toHaveBeenCalled();
    expect(
      screen.getByText(/T[ií]tulo y texto son obligatorios/i),
    ).toBeInTheDocument();
  });

  it('al enviar, hace POST al endpoint con order_id y rating', async () => {
    apiService.post.mockResolvedValue({ data: { id: 11, status: 'PENDING_MODERATION' } });
    render(wrap());

    fireEvent.change(screen.getByLabelText(/Calificaci[oó]n/i), {
      target: { value: '5' },
    });
    fireEvent.change(screen.getByLabelText(/T[ií]tulo/i), {
      target: { value: 'Excelente producto' },
    });
    fireEvent.change(screen.getByLabelText(/Texto/i), {
      target: { value: 'Cumple con lo prometido y mas. Gran calidad.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enviar rese[nñ]a/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/products/42/reviews/',
        expect.objectContaining({
          order_id: 77,
          rating:   5,
          title:    'Excelente producto',
          body:     'Cumple con lo prometido y mas. Gran calidad.',
        }),
      );
    });
  });

  it('muestra confirmacion al recibir', async () => {
    apiService.post.mockResolvedValue({ data: { id: 11, status: 'PENDING_MODERATION' } });
    render(wrap());
    fireEvent.change(screen.getByLabelText(/Calificaci[oó]n/i), {
      target: { value: '4' },
    });
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
