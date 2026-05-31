/**
 * Tests — AdminQuestionsAnswerPage
 * UC-QST-03: el admin responde preguntas pendientes de respuesta.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
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

afterEach(() => jest.clearAllMocks());

describe('AdminQuestionsAnswerPage (UC-QST-03)', () => {
  it('muestra el titulo de la cola', () => {
    apiService.get.mockResolvedValue({ data: { results: [] } });
    render(wrap(<AdminQuestionsAnswerPage />));
    expect(
      screen.getByRole('heading', { name: /Preguntas pendientes de respuesta/i }),
    ).toBeInTheDocument();
  });

  it('lista las preguntas aprobadas', async () => {
    apiService.get.mockResolvedValue({
      data: {
        results: [
          { id: 1, body: 'Tallas disponibles?', product: { id: 7, name: 'Camisa' } },
        ],
      },
    });
    render(wrap(<AdminQuestionsAnswerPage />));
    expect(await screen.findByText(/Tallas disponibles\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Camisa/i)).toBeInTheDocument();
  });

  it('al publicar la respuesta, hace POST al endpoint admin', async () => {
    apiService.get.mockResolvedValue({
      data: {
        results: [
          { id: 1, body: 'Tallas disponibles?', product: { id: 7, name: 'Camisa' } },
        ],
      },
    });
    apiService.post.mockResolvedValue({ data: { id: 1, status: 'ANSWERED' } });
    render(wrap(<AdminQuestionsAnswerPage />));
    await screen.findByText(/Tallas disponibles\?/i);

    fireEvent.change(screen.getByLabelText(/Respuesta para la pregunta #1/i),
      { target: { value: 'Las tallas son S, M, L y XL.' } });
    fireEvent.click(screen.getByRole('button', { name: /Publicar respuesta/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/admin/questions/1/answer/',
        expect.objectContaining({ answer_body: 'Las tallas son S, M, L y XL.' }),
      );
    });
  });
});
