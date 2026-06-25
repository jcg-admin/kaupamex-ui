/**
 * Tests — AdminQuestionsAnswerPage
 * UC-QST-03: el admin responde preguntas pendientes de respuesta.
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
import AdminQuestionsAnswerPage from './AdminQuestionsAnswerPage';

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

describe('AdminQuestionsAnswerPage (UC-QST-03)', () => {
  it('muestra el titulo de la cola', () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/questions/`, () => HttpResponse.json({ results: [] })),
    );
    render(wrap(<AdminQuestionsAnswerPage />));
    expect(
      screen.getByRole('heading', { name: /Preguntas pendientes de respuesta/i }),
    ).toBeInTheDocument();
  });

  it('lista las preguntas aprobadas', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/questions/`, () =>
        HttpResponse.json({
          results: [
            { id: 1, body: 'Tallas disponibles?', product: { id: 7, name: 'Camisa' } },
          ],
        }),
      ),
    );
    render(wrap(<AdminQuestionsAnswerPage />));
    expect(await screen.findByText(/Tallas disponibles\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Camisa/i)).toBeInTheDocument();
  });

  it('al publicar la respuesta, hace POST al endpoint admin', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/questions/`, () =>
        HttpResponse.json({
          results: [
            { id: 1, body: 'Tallas disponibles?', product: { id: 7, name: 'Camisa' } },
          ],
        }),
      ),
    );
    let answeredId;
    server.use(
      http.post(`${BASE}/api/v2/admin/questions/:id/answers/`, ({ params }) => {
        answeredId = params.id;
        return HttpResponse.json({ id: params.id, status: 'ANSWERED' });
      }),
    );
    render(wrap(<AdminQuestionsAnswerPage />));
    await screen.findByText(/Tallas disponibles\?/i);

    fireEvent.change(screen.getByLabelText(/Respuesta para la pregunta #1/i),
      { target: { value: 'Las tallas son S, M, L y XL.' } });
    fireEvent.click(screen.getByRole('button', { name: /Publicar respuesta/i }));

    await waitFor(() => expect(answeredId).toBe('1'));
  });
});
