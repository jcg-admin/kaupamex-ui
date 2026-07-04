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
      http.get(`${BASE}/api/v2/admin/reviews/`, () => HttpResponse.json({ results: [] })),
    );
    render(wrap(<AdminReviewsModerationPage />));
    expect(
      screen.getByRole('heading', { name: /Moderaci[oó]n de rese[nñ]as/i }),
    ).toBeInTheDocument();
  });

  it('lista las resenas pendientes de moderacion', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/reviews/`, () =>
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

  it('al hacer clic en Aprobar, hace PATCH al endpoint status', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/reviews/`, () =>
        HttpResponse.json({
          results: [
            { id: 5, rating: 5, title: 'X', body: 'Y', product: { id: 7, name: 'Z' } },
          ],
        }),
      ),
    );
    let approvedId;
    let approveBody;
    server.use(
      http.patch(`${BASE}/api/v2/admin/reviews/:id/status/`, async ({ params, request }) => {
        approvedId = params.id;
        approveBody = await request.json();
        return HttpResponse.json({ id: params.id, status: 'APPROVED' });
      }),
    );
    render(wrap(<AdminReviewsModerationPage />));
    await screen.findByText(/^Y$/);
    fireEvent.click(screen.getByRole('button', { name: /^Aprobar$/i }));

    await waitFor(() => expect(approvedId).toBe('5'));
    // El backend espera { action: 'approve' } — no { status }.
    expect(approveBody).toEqual({ action: 'approve' });
  });

  it('al hacer clic en Rechazar, hace PATCH al endpoint status con motivo', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/reviews/`, () =>
        HttpResponse.json({
          results: [
            { id: 5, rating: 1, title: 'X', body: 'Y', product: { id: 7, name: 'Z' } },
          ],
        }),
      ),
    );
    let rejectedId;
    let rejectBody;
    server.use(
      http.patch(`${BASE}/api/v2/admin/reviews/:id/status/`, async ({ params, request }) => {
        rejectedId = params.id;
        rejectBody = await request.json();
        return HttpResponse.json({ id: params.id, status: 'REJECTED' });
      }),
    );
    render(wrap(<AdminReviewsModerationPage />));
    await screen.findByText(/^Y$/);
    fireEvent.click(screen.getByRole('button', { name: /Rechazar/i }));

    await waitFor(() => expect(rejectedId).toBe('5'));
    // El backend espera { action: 'reject', reason } — no { status }.
    expect(rejectBody.action).toBe('reject');
    expect(rejectBody.reason).toBeTruthy();
  });

  it('muestra estado vacio cuando no hay resenas pendientes', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/reviews/`, () => HttpResponse.json({ results: [] })),
    );
    render(wrap(<AdminReviewsModerationPage />));
    expect(
      await screen.findByText(/No hay rese[nñ]as pendientes/i),
    ).toBeInTheDocument();
  });
});
