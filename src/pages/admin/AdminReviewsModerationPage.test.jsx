/**
 * Tests — AdminReviewsModerationPage
 * UC-REV-03: cola admin de moderacion. Aprobar / rechazar resenas.
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

afterEach(() => jest.clearAllMocks());

describe('AdminReviewsModerationPage (UC-REV-03)', () => {
  it('muestra el titulo de la cola de moderacion', () => {
    apiService.get.mockResolvedValue({ data: { results: [] } });
    render(wrap(<AdminReviewsModerationPage />));
    expect(
      screen.getByRole('heading', { name: /Moderaci[oó]n de rese[nñ]as/i }),
    ).toBeInTheDocument();
  });

  it('lista las resenas pendientes de moderacion', async () => {
    apiService.get.mockResolvedValue({
      data: {
        results: [
          {
            id: 5,
            rating: 4,
            title: 'Excelente articulo',
            body:  'Cumple las expectativas',
            product: { id: 7, name: 'Camisa' },
          },
        ],
      },
    });
    render(wrap(<AdminReviewsModerationPage />));
    expect(await screen.findByText(/Excelente articulo/)).toBeInTheDocument();
    expect(screen.getByText(/Cumple las expectativas/)).toBeInTheDocument();
  });

  it('al hacer clic en Aprobar, hace POST al endpoint approve', async () => {
    apiService.get.mockResolvedValue({
      data: {
        results: [
          { id: 5, rating: 5, title: 'X', body: 'Y', product: { id: 7, name: 'Z' } },
        ],
      },
    });
    apiService.post.mockResolvedValue({ data: { id: 5, status: 'APPROVED' } });
    render(wrap(<AdminReviewsModerationPage />));
    await screen.findByText(/^Y$/);
    fireEvent.click(screen.getByRole('button', { name: /^Aprobar$/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/admin/reviews/5/approve/',
        expect.any(Object),
      );
    });
  });

  it('al hacer clic en Rechazar, hace POST al endpoint reject con motivo', async () => {
    apiService.get.mockResolvedValue({
      data: {
        results: [
          { id: 5, rating: 1, title: 'X', body: 'Y', product: { id: 7, name: 'Z' } },
        ],
      },
    });
    apiService.post.mockResolvedValue({ data: { id: 5, status: 'REJECTED' } });
    render(wrap(<AdminReviewsModerationPage />));
    await screen.findByText(/^Y$/);
    fireEvent.click(screen.getByRole('button', { name: /Rechazar/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/admin/reviews/5/reject/',
        expect.objectContaining({ reason: expect.any(String) }),
      );
    });
  });

  it('muestra estado vacio cuando no hay resenas pendientes', async () => {
    apiService.get.mockResolvedValue({ data: { results: [] } });
    render(wrap(<AdminReviewsModerationPage />));
    expect(
      await screen.findByText(/No hay rese[nñ]as pendientes/i),
    ).toBeInTheDocument();
  });
});
