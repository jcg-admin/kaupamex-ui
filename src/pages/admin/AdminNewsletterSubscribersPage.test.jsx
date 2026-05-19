/**
 * Tests — AdminNewsletterSubscribersPage
 * UC-NEW-03: el admin ve, filtra y desuscribe manualmente suscriptores.
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
import newsletterReducer from '@redux/slices/newsletterSlice';
import AdminNewsletterSubscribersPage from './AdminNewsletterSubscribersPage';

const makeStore = () =>
  configureStore({ reducer: { newsletter: newsletterReducer } });

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

describe('AdminNewsletterSubscribersPage (UC-NEW-03)', () => {
  it('muestra el titulo de la pagina', () => {
    apiService.get.mockResolvedValue({ data: { results: [], total: 0 } });
    render(wrap(<AdminNewsletterSubscribersPage />));
    expect(
      screen.getByRole('heading', { name: /Suscriptores del newsletter/i }),
    ).toBeInTheDocument();
  });

  it('lista los suscriptores recibidos', async () => {
    apiService.get.mockResolvedValue({
      data: {
        results: [
          { id: 1, email: 'ana@x.com', status: 'ACTIVE',       subscribed_at: '2026-01-10T00:00:00Z' },
          { id: 2, email: 'bob@x.com', status: 'UNSUBSCRIBED', subscribed_at: '2025-12-01T00:00:00Z' },
        ],
        total: 2,
      },
    });
    render(wrap(<AdminNewsletterSubscribersPage />));
    expect(await screen.findByText(/ana@x.com/i)).toBeInTheDocument();
    expect(screen.getByText(/bob@x.com/i)).toBeInTheDocument();
  });

  it('llama al endpoint admin con el filtro de estado', async () => {
    apiService.get.mockResolvedValue({ data: { results: [] } });
    render(wrap(<AdminNewsletterSubscribersPage />));
    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalledWith(
        '/api/v1/admin/newsletter/subscribers/',
        expect.objectContaining({ params: expect.any(Object) }),
      );
    });
  });

  it('al hacer clic en Desuscribir, hace POST al endpoint manual', async () => {
    apiService.get.mockResolvedValue({
      data: {
        results: [
          { id: 1, email: 'ana@x.com', status: 'ACTIVE', subscribed_at: '2026-01-10T00:00:00Z' },
        ],
      },
    });
    apiService.post.mockResolvedValue({ data: { ok: true } });
    render(wrap(<AdminNewsletterSubscribersPage />));
    const row = await screen.findByText(/ana@x.com/i);
    expect(row).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Desuscribir/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/admin/newsletter/subscribers/1/unsubscribe/',
        expect.objectContaining({ reason: 'SOLICITUD_MANUAL' }),
      );
    });
  });
});
