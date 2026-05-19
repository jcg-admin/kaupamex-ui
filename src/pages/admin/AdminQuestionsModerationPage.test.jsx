/**
 * Tests — AdminQuestionsModerationPage
 * UC-QST-04: cola de moderacion. Aprobar / rechazar preguntas.
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

afterEach(() => jest.clearAllMocks());

describe('AdminQuestionsModerationPage (UC-QST-04)', () => {
  it('muestra el titulo de la cola de moderacion', () => {
    apiService.get.mockResolvedValue({ data: { results: [] } });
    render(wrap(<AdminQuestionsModerationPage />));
    expect(
      screen.getByRole('heading', { name: /Moderaci[oó]n de preguntas/i }),
    ).toBeInTheDocument();
  });

  it('lista las preguntas pendientes de moderacion', async () => {
    apiService.get.mockResolvedValue({
      data: {
        results: [
          { id: 5, body: 'Pregunta a moderar', product: { id: 7, name: 'Camisa' } },
        ],
      },
    });
    render(wrap(<AdminQuestionsModerationPage />));
    expect(await screen.findByText(/Pregunta a moderar/i)).toBeInTheDocument();
  });

  it('al hacer clic en Aprobar, hace POST al endpoint approve', async () => {
    apiService.get.mockResolvedValue({
      data: { results: [{ id: 5, body: 'X', product: { id: 7, name: 'Y' } }] },
    });
    apiService.post.mockResolvedValue({ data: { id: 5, status: 'APPROVED' } });
    render(wrap(<AdminQuestionsModerationPage />));
    await screen.findByText(/^X$/);
    fireEvent.click(screen.getByRole('button', { name: /^Aprobar$/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/admin/questions/5/approve/',
        expect.any(Object),
      );
    });
  });

  it('al hacer clic en Rechazar, hace POST al endpoint reject', async () => {
    apiService.get.mockResolvedValue({
      data: { results: [{ id: 5, body: 'X', product: { id: 7, name: 'Y' } }] },
    });
    apiService.post.mockResolvedValue({ data: { id: 5, status: 'REJECTED' } });
    render(wrap(<AdminQuestionsModerationPage />));
    await screen.findByText(/^X$/);
    fireEvent.click(screen.getByRole('button', { name: /Rechazar/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/admin/questions/5/reject/',
        expect.objectContaining({ reason: expect.any(String) }),
      );
    });
  });
});
