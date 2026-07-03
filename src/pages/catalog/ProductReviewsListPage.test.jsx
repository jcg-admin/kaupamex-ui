/**
 * Tests — ProductReviewsListPage
 * UC-REV-02: visitante ve resenas aprobadas de un producto.
 */
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';
import reviewsReducer from '@redux/slices/reviewsSlice';
import ProductReviewsListPage from './ProductReviewsListPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const makeStore = () => configureStore({ reducer: { reviews: reviewsReducer } });

const wrap = (path = '/catalog/42/reviews') => (
  <Provider store={makeStore()}>
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/catalog/:productId/reviews"
            element={<ProductReviewsListPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  </Provider>
);

describe('ProductReviewsListPage (UC-REV-02)', () => {
  it('muestra el titulo de la seccion de resenas', () => {
    server.use(
      http.get(`${BASE}/api/v2/products/42/reviews/`, () =>
        HttpResponse.json({ results: [] }),
      ),
    );
    render(wrap());
    expect(
      screen.getByRole('heading', { name: /Rese[nñ]as del producto/i }),
    ).toBeInTheDocument();
  });

  it('GET al endpoint publico del producto', async () => {
    let capturedUrl;
    server.use(
      http.get(`${BASE}/api/v2/products/42/reviews/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ results: [] });
      }),
    );
    render(wrap());
    await screen.findByText(/A[uú]n no hay rese[nñ]as/i);
    expect(capturedUrl).toContain('/api/v2/products/42/reviews/');
  });

  it('muestra la calificacion promedio y el total de resenas', async () => {
    server.use(
      http.get(`${BASE}/api/v2/products/42/reviews/`, () =>
        HttpResponse.json({
          results: [
            { id: 1, rating: 5, title: 'Bueno', body: 'Cumple lo prometido' },
            { id: 2, rating: 4, title: 'Bien', body: 'Calidad correcta' },
          ],
          average_rating: 4.5,
          total_reviews:  2,
          rating_breakdown: { '5': 1, '4': 1 },
        }),
      ),
    );
    render(wrap());
    expect(await screen.findByText(/4\.5/)).toBeInTheDocument();
    expect(screen.getByText(/2 rese[nñ]as/i)).toBeInTheDocument();
  });

  it('lista los items con titulo y texto', async () => {
    server.use(
      http.get(`${BASE}/api/v2/products/42/reviews/`, () =>
        HttpResponse.json({
          results: [
            { id: 1, rating: 5, title: 'Excelente', body: 'Recomendado.' },
          ],
          average_rating: 5.0,
          total_reviews:  1,
        }),
      ),
    );
    render(wrap());
    expect(await screen.findByText(/Excelente/)).toBeInTheDocument();
    expect(screen.getByText(/Recomendado\./)).toBeInTheDocument();
  });

  it('muestra estado vacio cuando no hay resenas', async () => {
    server.use(
      http.get(`${BASE}/api/v2/products/42/reviews/`, () =>
        HttpResponse.json({ results: [] }),
      ),
    );
    render(wrap());
    expect(
      await screen.findByText(/A[uú]n no hay rese[nñ]as aprobadas/i),
    ).toBeInTheDocument();
  });
});
