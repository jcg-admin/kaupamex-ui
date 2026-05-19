/**
 * Tests — AdminSupportPage
 * UC-SUPP-05: Bandeja y reporte de tickets (Admin)
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
import supportTicketsReducer from '@redux/slices/supportTicketsSlice';
import AdminSupportPage from './AdminSupportPage';

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
  { id: 100, subject: 'Pedido perdido',     status: 'OPEN',    created_at: '2026-05-10T10:00:00Z',
    customer: { id: 1, email: 'comprador@test.mx', name: 'Demo Yoruba' }, replies_count: 0 },
  { id: 101, subject: 'Producto defectuoso', status: 'REPLIED', created_at: '2026-05-12T10:00:00Z',
    customer: { id: 2, email: 'maria@test.mx',     name: 'Maria Lopez' }, replies_count: 2 },
  { id: 102, subject: 'Caso resuelto',       status: 'CLOSED',  created_at: '2026-05-05T10:00:00Z',
    customer: { id: 3, email: 'juan@test.mx',      name: 'Juan Diaz' },   replies_count: 4 },
];

const RESPONSE = {
  results: TICKETS,
  metrics: { open: 1, replied: 1, closed: 1, avg_first_response_hours: 3.5 },
};

afterEach(() => jest.clearAllMocks());

describe('AdminSupportPage (UC-SUPP-05)', () => {
  it('muestra el titulo de la bandeja', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminSupportPage />, makeStore()));
    expect(
      await screen.findByRole('heading', { name: /Bandeja de soporte/i })
    ).toBeInTheDocument();
  });

  it('renderiza la tabla con todos los tickets', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminSupportPage />, makeStore()));
    expect(await screen.findByText('Pedido perdido')).toBeInTheDocument();
    expect(screen.getByText('Producto defectuoso')).toBeInTheDocument();
    expect(screen.getByText('Caso resuelto')).toBeInTheDocument();
  });

  it('muestra el email del comprador en cada fila', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminSupportPage />, makeStore()));
    expect(await screen.findByText('comprador@test.mx')).toBeInTheDocument();
    expect(screen.getByText('maria@test.mx')).toBeInTheDocument();
  });

  it('muestra el panel de metricas del periodo', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminSupportPage />, makeStore()));
    expect(await screen.findByText(/Abiertos/i)).toBeInTheDocument();
    expect(screen.getByText(/Respondidos/i)).toBeInTheDocument();
    expect(screen.getByText(/Cerrados/i)).toBeInTheDocument();
  });

  it('filtra el listado por estado al cambiar el selector', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminSupportPage />, makeStore()));
    await screen.findByText('Pedido perdido');

    fireEvent.change(screen.getByLabelText(/Estado/i), { target: { value: 'OPEN' } });

    await waitFor(() => {
      expect(apiService.get).toHaveBeenLastCalledWith(
        expect.stringContaining('/admin/support/tickets/'),
        expect.objectContaining({ params: expect.objectContaining({ status: 'OPEN' }) }),
      );
    });
  });

  it('muestra estado vacio cuando no hay tickets', async () => {
    apiService.get.mockResolvedValue({ data: { results: [], metrics: null } });
    render(wrap(<AdminSupportPage />, makeStore()));
    expect(
      await screen.findByText(/No se encontraron tickets/i)
    ).toBeInTheDocument();
  });
});
