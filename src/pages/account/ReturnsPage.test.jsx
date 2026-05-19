/**
 * Tests — ReturnsPage
 * UC-RET-04: Listar devoluciones del comprador
 */
import { render, screen } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import returnsReducer from '@redux/slices/returnsSlice';
import ReturnsPage from './ReturnsPage';

const makeStore = () =>
  configureStore({ reducer: { returns: returnsReducer } });

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (ui, store) => (
  <Provider store={store}>
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  </Provider>
);

const RETURNS = [
  { id: 10, order_id: 'ORD-001', status: 'PENDIENTE_REVISION', created_at: '2026-05-10T10:00:00Z' },
  { id: 11, order_id: 'ORD-002', status: 'APROBADA',           created_at: '2026-05-09T10:00:00Z' },
  { id: 12, order_id: 'ORD-003', status: 'COMPLETADA',         created_at: '2026-05-01T10:00:00Z' },
  { id: 13, order_id: 'ORD-004', status: 'RECHAZADA',          created_at: '2026-04-25T10:00:00Z' },
];

afterEach(() => jest.clearAllMocks());

describe('ReturnsPage (UC-RET-04 listado)', () => {
  it('muestra el titulo de la pagina', async () => {
    apiService.get.mockResolvedValue({ data: { results: RETURNS } });
    render(wrap(<ReturnsPage />, makeStore()));
    expect(
      await screen.findByRole('heading', { name: /Mis devoluciones/i })
    ).toBeInTheDocument();
  });

  it('renderiza las devoluciones del comprador', async () => {
    apiService.get.mockResolvedValue({ data: { results: RETURNS } });
    render(wrap(<ReturnsPage />, makeStore()));
    expect(await screen.findByText('ORD-001')).toBeInTheDocument();
    expect(screen.getByText('ORD-002')).toBeInTheDocument();
    expect(screen.getByText('ORD-003')).toBeInTheDocument();
  });

  it('muestra los estados en español', async () => {
    apiService.get.mockResolvedValue({ data: { results: RETURNS } });
    render(wrap(<ReturnsPage />, makeStore()));
    expect(await screen.findByText(/Pendiente de revisión/i)).toBeInTheDocument();
    expect(screen.getByText(/^Aprobada$/i)).toBeInTheDocument();
    expect(screen.getByText(/Completada/i)).toBeInTheDocument();
    expect(screen.getByText(/Rechazada/i)).toBeInTheDocument();
  });

  it('muestra estado vacio cuando no hay devoluciones', async () => {
    apiService.get.mockResolvedValue({ data: { results: [] } });
    render(wrap(<ReturnsPage />, makeStore()));
    expect(
      await screen.findByText(/No tienes devoluciones/i)
    ).toBeInTheDocument();
  });

  it('muestra enlace para crear una nueva devolucion', async () => {
    apiService.get.mockResolvedValue({ data: { results: RETURNS } });
    render(wrap(<ReturnsPage />, makeStore()));
    const link = await screen.findByRole('link', { name: /Solicitar devoluci/i });
    expect(link).toHaveAttribute('href', '/account/returns/new');
  });
});
