/**
 * Tests — SearchHistoryPage (UC-SRCH-03).
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

import apiService from '@services/apiService';
import searchHistoryReducer from '../../redux/slices/searchHistorySlice';
import SearchHistoryPage from './SearchHistoryPage';

const ENTRY_1 = { id: 1, term: 'oshun',  searched_at: '2026-05-19T10:00:00Z' };
const ENTRY_2 = { id: 2, term: 'yemaya', searched_at: '2026-05-18T08:00:00Z' };

const makeStore = () =>
  configureStore({ reducer: { searchHistory: searchHistoryReducer } });

const renderPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <Provider store={makeStore()}>
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <SearchHistoryPage />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
};

afterEach(() => jest.clearAllMocks());

describe('SearchHistoryPage (UC-SRCH-03)', () => {
  it('muestra el titulo «Historial de busquedas»', async () => {
    apiService.get.mockResolvedValue({ data: { results: [], count: 0 } });
    renderPage();
    expect(
      await screen.findByRole('heading', { name: /historial de busquedas/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it('renderiza la lista de terminos con su fecha', async () => {
    apiService.get.mockResolvedValue({
      data: { results: [ENTRY_1, ENTRY_2], count: 2 },
    });
    renderPage();
    expect(await screen.findByText('oshun')).toBeInTheDocument();
    expect(screen.getByText('yemaya')).toBeInTheDocument();
  });

  it('cada termino enlaza a /search?q=<term>', async () => {
    apiService.get.mockResolvedValue({
      data: { results: [ENTRY_1], count: 1 },
    });
    renderPage();
    const link = await screen.findByRole('link', { name: /oshun/i });
    expect(link).toHaveAttribute('href', '/search?q=oshun');
  });

  it('muestra el estado vacio cuando no hay historial', async () => {
    apiService.get.mockResolvedValue({ data: { results: [], count: 0 } });
    renderPage();
    expect(
      await screen.findByText(/aun no tienes busquedas guardadas/i),
    ).toBeInTheDocument();
  });

  it('eliminar una entrada llama DELETE /api/v1/search/history/:id/ (Alt A)', async () => {
    apiService.get.mockResolvedValue({ data: { results: [ENTRY_1], count: 1 } });
    apiService.delete.mockResolvedValue({ data: null });
    renderPage();
    const btn = await screen.findByRole('button', { name: /eliminar "oshun" del historial/i });
    fireEvent.click(btn);
    await waitFor(() =>
      expect(apiService.delete).toHaveBeenCalledWith('/api/v1/search/history/1/'),
    );
  });

  it('borrar todo llama DELETE /api/v1/search/history/ (Alt B)', async () => {
    apiService.get.mockResolvedValue({ data: { results: [ENTRY_1], count: 1 } });
    apiService.delete.mockResolvedValue({ data: null });
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);
    renderPage();
    const btn = await screen.findByRole('button', { name: /borrar todo el historial/i });
    fireEvent.click(btn);
    await waitFor(() =>
      expect(apiService.delete).toHaveBeenCalledWith('/api/v1/search/history/'),
    );
    window.confirm = originalConfirm;
  });

  it('muestra error si la API falla', async () => {
    apiService.get.mockRejectedValue(new Error('boom'));
    renderPage();
    expect(
      await screen.findByText(/no se pudo cargar el historial/i),
    ).toBeInTheDocument();
  });
});
