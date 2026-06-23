/**
 * Tests — AdminQuestionsModerationPage
 * UC-QST-04: cola de moderacion. Aprobar / rechazar preguntas.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

const BASE = process.env.API_URL || 'http://localhost:8000';

import questionsReducer from '@redux/slices/questionsSlice';
import AdminQuestionsModerationPage from './AdminQuestionsModerationPage';

const makeStore = () =>
  configureStore({ reducer: { questions: questionsReducer } });

const makeQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (ui) => (
  <Provider store={makeStore()}>
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  </Provider>
);

describe('AdminQuestionsModerationPage (UC-QST-04)', () => {
  it('muestra el titulo de la cola de moderacion', () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/questions/`, () => HttpResponse.json({ results: [] })),
    );
    render(wrap(<AdminQuestionsModerationPage />));
    expect(
      screen.getByRole('heading', { name: /Moderaci[oó]n de preguntas/i }),
    ).toBeInTheDocument();
  });

  it('lista las preguntas pendientes de moderacion', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/questions/`, () =>
        HttpResponse.json({
          results: [
            { id: 5, body: 'Pregunta a moderar', product: { id: 7, name: 'Camisa' } },
          ],
        }),
      ),
    );
    render(wrap(<AdminQuestionsModerationPage />));
    expect(await screen.findByText(/Pregunta a moderar/i)).toBeInTheDocument();
  });

  it('al hacer clic en Aprobar, hace POST al endpoint approve', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/questions/`, () =>
        HttpResponse.json({
          results: [{ id: 5, body: 'X', product: { id: 7, name: 'Y' } }],
        }),
      ),
    );
    let approvedId;
    server.use(
      http.post(`${BASE}/api/v1/admin/questions/:id/approve/`, ({ params }) => {
        approvedId = params.id;
        return HttpResponse.json({ id: params.id, status: 'APPROVED' });
      }),
    );
    render(wrap(<AdminQuestionsModerationPage />));
    await screen.findByText(/^X$/);
    fireEvent.click(screen.getByRole('button', { name: /^Aprobar$/i }));

    await waitFor(() => expect(approvedId).toBe('5'));
  });

  it('al hacer clic en Rechazar, hace POST al endpoint reject', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/questions/`, () =>
        HttpResponse.json({
          results: [{ id: 5, body: 'X', product: { id: 7, name: 'Y' } }],
        }),
      ),
    );
    let rejectedId;
    server.use(
      http.post(`${BASE}/api/v1/admin/questions/:id/reject/`, ({ params }) => {
        rejectedId = params.id;
        return HttpResponse.json({ id: params.id, status: 'REJECTED' });
      }),
    );
    render(wrap(<AdminQuestionsModerationPage />));
    await screen.findByText(/^X$/);
    fireEvent.click(screen.getByRole('button', { name: /Rechazar/i }));

    await waitFor(() => expect(rejectedId).toBe('5'));
  });
});
