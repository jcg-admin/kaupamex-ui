/**
 * Tests — AdminReviewsModerationPage
 * UC-REV-03: cola admin de moderacion. Aprobar / rechazar resenas.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

const BASE = process.env.API_URL || 'http://localhost:8000';

import reviewsReducer from '@redux/slices/reviewsSlice';
import AdminReviewsModerationPage from './AdminReviewsModerationPage';

const makeStore = () =>
  configureStore({ reducer: { reviews: reviewsReducer } });

const makeQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (ui) => (
  <Provider store={makeStore()}>
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  </Provider>
);

describe('AdminReviewsModerationPage (UC-REV-03)', () => {
  it('muestra el titulo de la cola de moderacion', () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/reviews/`, () => HttpResponse.json({ results: [] })),
    );
    render(wrap(<AdminReviewsModerationPage />));
    expect(
      screen.getByRole('heading', { name: /Moderaci[oó]n de rese[nñ]as/i }),
    ).toBeInTheDocument();
  });

  it('lista las resenas pendientes de moderacion', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/reviews/`, () =>
        HttpResponse.json({
          results: [
            {
              id: 5,
              rating: 4,
              title: 'Excelente articulo',
              body:  'Cumple las expectativas',
              product: { id: 7, name: 'Camisa' },
            },
          ],
        }),
      ),
    );
    render(wrap(<AdminReviewsModerationPage />));
    expect(await screen.findByText(/Excelente articulo/)).toBeInTheDocument();
    expect(screen.getByText(/Cumple las expectativas/)).toBeInTheDocument();
  });

  it('al hacer clic en Aprobar, hace POST al endpoint approve', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/reviews/`, () =>
        HttpResponse.json({
          results: [
            { id: 5, rating: 5, title: 'X', body: 'Y', product: { id: 7, name: 'Z' } },
          ],
        }),
      ),
    );
    let approvedId;
    server.use(
      http.post(`${BASE}/api/v1/admin/reviews/:id/approve/`, ({ params }) => {
        approvedId = params.id;
        return HttpResponse.json({ id: params.id, status: 'APPROVED' });
      }),
    );
    render(wrap(<AdminReviewsModerationPage />));
    await screen.findByText(/^Y$/);
    fireEvent.click(screen.getByRole('button', { name: /^Aprobar$/i }));

    await waitFor(() => expect(approvedId).toBe('5'));
  });

  it('al hacer clic en Rechazar, hace POST al endpoint reject con motivo', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/reviews/`, () =>
        HttpResponse.json({
          results: [
            { id: 5, rating: 1, title: 'X', body: 'Y', product: { id: 7, name: 'Z' } },
          ],
        }),
      ),
    );
    let rejectedId;
    server.use(
      http.post(`${BASE}/api/v1/admin/reviews/:id/reject/`, ({ params }) => {
        rejectedId = params.id;
        return HttpResponse.json({ id: params.id, status: 'REJECTED' });
      }),
    );
    render(wrap(<AdminReviewsModerationPage />));
    await screen.findByText(/^Y$/);
    fireEvent.click(screen.getByRole('button', { name: /Rechazar/i }));

    await waitFor(() => expect(rejectedId).toBe('5'));
  });

  it('muestra estado vacio cuando no hay resenas pendientes', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/reviews/`, () => HttpResponse.json({ results: [] })),
    );
    render(wrap(<AdminReviewsModerationPage />));
    expect(
      await screen.findByText(/No hay rese[nñ]as pendientes/i),
    ).toBeInTheDocument();
  });
});
