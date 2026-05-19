/**
 * Tests — ProductQuestionsListPage
 * UC-QST-02: lista publica de preguntas con respuesta aprobada.
 */
import { render, screen } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import questionsReducer from '@redux/slices/questionsSlice';
import ProductQuestionsListPage from './ProductQuestionsListPage';

const makeStore = () =>
  configureStore({ reducer: { questions: questionsReducer } });

const makeQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (initialPath = '/catalog/42/questions') => (
  <Provider store={makeStore()}>
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/catalog/:productId/questions" element={<ProductQuestionsListPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  </Provider>
);

afterEach(() => jest.clearAllMocks());

describe('ProductQuestionsListPage (UC-QST-02)', () => {
  it('muestra las preguntas con sus respuestas aprobadas', async () => {
    apiService.get.mockResolvedValue({
      data: {
        results: [
          { id: 1, body: 'Tienen envio gratis?', answer: { body: 'Si, a partir de 500 pesos.' } },
          { id: 2, body: 'Cuanto tarda?',         answer: { body: '3 a 5 dias habiles.' } },
        ],
      },
    });
    render(wrap());
    expect(await screen.findByText(/Tienen envio gratis\?/i)).toBeInTheDocument();
    expect(screen.getByText(/a partir de 500 pesos/i)).toBeInTheDocument();
    expect(screen.getByText(/Cuanto tarda\?/i)).toBeInTheDocument();
  });

  it('muestra estado vacio si no hay preguntas respondidas', async () => {
    apiService.get.mockResolvedValue({ data: { results: [] } });
    render(wrap());
    expect(
      await screen.findByText(/Aun no hay preguntas respondidas/i),
    ).toBeInTheDocument();
  });

  it('llama al endpoint con productId', async () => {
    apiService.get.mockResolvedValue({ data: { results: [] } });
    render(wrap());
    await screen.findByText(/Aun no hay preguntas/i);
    expect(apiService.get).toHaveBeenCalledWith(
      '/api/v1/products/42/questions/',
      expect.any(Object),
    );
  });
});
