/**
 * Tests — SupportTicketsPage
 * UC-SUPP-02: Listar tickets del comprador
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
import supportTicketsReducer from '@redux/slices/supportTicketsSlice';
import SupportTicketsPage from './SupportTicketsPage';

const makeStore = () =>
  configureStore({ reducer: { supportTickets: supportTicketsReducer } });

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (ui, store) => (
  <Provider store={store}>
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  </Provider>
);

const TICKETS = [
  { id: 1, subject: 'Pedido tardio',     status: 'OPEN',    created_at: '2026-05-10T10:00:00Z' },
  { id: 2, subject: 'Producto defectuoso', status: 'REPLIED', created_at: '2026-05-08T10:00:00Z' },
  { id: 3, subject: 'Caso resuelto',     status: 'CLOSED',  created_at: '2026-05-01T10:00:00Z' },
];

afterEach(() => jest.clearAllMocks());

describe('SupportTicketsPage (UC-SUPP-02 lista)', () => {
  it('muestra el titulo de la pagina', async () => {
    apiService.get.mockResolvedValue({ data: { results: TICKETS } });
    render(wrap(<SupportTicketsPage />, makeStore()));
    expect(
      await screen.findByRole('heading', { name: /Mis tickets de soporte/i })
    ).toBeInTheDocument();
  });

  it('renderiza los tickets del comprador', async () => {
    apiService.get.mockResolvedValue({ data: { results: TICKETS } });
    render(wrap(<SupportTicketsPage />, makeStore()));
    expect(await screen.findByText('Pedido tardio')).toBeInTheDocument();
    expect(screen.getByText('Producto defectuoso')).toBeInTheDocument();
    expect(screen.getByText('Caso resuelto')).toBeInTheDocument();
  });

  it('muestra los estados de cada ticket en español', async () => {
    apiService.get.mockResolvedValue({ data: { results: TICKETS } });
    render(wrap(<SupportTicketsPage />, makeStore()));
    expect(await screen.findByText('Abierto')).toBeInTheDocument();
    expect(screen.getByText('Respondido')).toBeInTheDocument();
    expect(screen.getByText('Cerrado')).toBeInTheDocument();
  });

  it('muestra estado vacio cuando no hay tickets', async () => {
    apiService.get.mockResolvedValue({ data: { results: [] } });
    render(wrap(<SupportTicketsPage />, makeStore()));
    expect(
      await screen.findByText(/No tienes tickets de soporte/i)
    ).toBeInTheDocument();
  });

  it('muestra enlace para abrir un nuevo ticket', async () => {
    apiService.get.mockResolvedValue({ data: { results: TICKETS } });
    render(wrap(<SupportTicketsPage />, makeStore()));
    const link = await screen.findByRole('link', { name: /Abrir nuevo ticket/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/support/tickets/new');
  });
});
