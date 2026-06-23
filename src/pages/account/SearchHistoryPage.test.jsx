/**
 * Tests — SearchHistoryPage (UC-SRCH-03).
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import searchHistoryReducer from '../../redux/slices/searchHistorySlice';
import SearchHistoryPage from './SearchHistoryPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

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

describe('SearchHistoryPage (UC-SRCH-03)', () => {
  it('muestra el titulo «Historial de busquedas»', async () => {
    server.use(
      http.get(`${BASE}/api/v1/search/history/`, () =>
        HttpResponse.json({ results: [], count: 0 }),
      ),
    );
    renderPage();
    expect(
      await screen.findByRole('heading', { name: /historial de busquedas/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it('renderiza la lista de terminos con su fecha', async () => {
    server.use(
      http.get(`${BASE}/api/v1/search/history/`, () =>
        HttpResponse.json({ results: [ENTRY_1, ENTRY_2], count: 2 }),
      ),
    );
    renderPage();
    expect(await screen.findByText('oshun')).toBeInTheDocument();
    expect(screen.getByText('yemaya')).toBeInTheDocument();
  });

  it('cada termino enlaza a /search?q=<term>', async () => {
    server.use(
      http.get(`${BASE}/api/v1/search/history/`, () =>
        HttpResponse.json({ results: [ENTRY_1], count: 1 }),
      ),
    );
    renderPage();
    const link = await screen.findByRole('link', { name: /oshun/i });
    expect(link).toHaveAttribute('href', '/search?q=oshun');
  });

  it('muestra el estado vacio cuando no hay historial', async () => {
    server.use(
      http.get(`${BASE}/api/v1/search/history/`, () =>
        HttpResponse.json({ results: [], count: 0 }),
      ),
    );
    renderPage();
    expect(
      await screen.findByText(/aun no tienes busquedas guardadas/i),
    ).toBeInTheDocument();
  });

  it('eliminar una entrada llama DELETE /api/v1/search/history/:id/ (Alt A)', async () => {
    server.use(
      http.get(`${BASE}/api/v1/search/history/`, () =>
        HttpResponse.json({ results: [ENTRY_1], count: 1 }),
      ),
    );
    let deleteCalled = false;
    server.use(
      http.delete(`${BASE}/api/v1/search/history/1/`, () => {
        deleteCalled = true;
        return HttpResponse.json(null);
      }),
    );
    renderPage();
    const btn = await screen.findByRole('button', { name: /eliminar "oshun" del historial/i });
    fireEvent.click(btn);
    await waitFor(() => expect(deleteCalled).toBe(true));
  });

  it('borrar todo llama DELETE /api/v1/search/history/ (Alt B)', async () => {
    server.use(
      http.get(`${BASE}/api/v1/search/history/`, () =>
        HttpResponse.json({ results: [ENTRY_1], count: 1 }),
      ),
    );
    let deleteCalled = false;
    server.use(
      http.delete(`${BASE}/api/v1/search/history/`, () => {
        deleteCalled = true;
        return HttpResponse.json(null);
      }),
    );
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);
    renderPage();
    const btn = await screen.findByRole('button', { name: /borrar todo el historial/i });
    fireEvent.click(btn);
    await waitFor(() => expect(deleteCalled).toBe(true));
    window.confirm = originalConfirm;
  });

  it('muestra error si la API falla', async () => {
    server.use(
      http.get(`${BASE}/api/v1/search/history/`, () =>
        HttpResponse.json({ detail: 'Error' }, { status: 400 }),
      ),
    );
    renderPage();
    expect(
      await screen.findByText(/no se pudo cargar el historial/i),
    ).toBeInTheDocument();
  });
});
