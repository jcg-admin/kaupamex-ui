/**
 * Tests — SupportTicketDetailPage
 * UC-SUPP-02: Ver detalle de ticket
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
import supportTicketsReducer from '@redux/slices/supportTicketsSlice';
import SupportTicketDetailPage from './SupportTicketDetailPage';

const makeStore = () =>
  configureStore({ reducer: { supportTickets: supportTicketsReducer } });

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderAt = (path, store) => render(
  <Provider store={store}>
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/support/tickets/:id" element={<SupportTicketDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  </Provider>
);

const TICKET_DETAIL = {
  id: 42,
  subject: 'Pedido tardio',
  body:    'Mi pedido lleva 10 dias sin llegar',
  status:  'REPLIED',
  created_at: '2026-05-10T10:00:00Z',
  replies: [
    { id: 1, body: 'Hola, revisamos tu pedido.', author: 'admin',
      is_internal: false, sent_at: '2026-05-11T09:00:00Z' },
    { id: 2, body: 'Gracias, sigo esperando.',    author: 'buyer',
      is_internal: false, sent_at: '2026-05-12T08:30:00Z' },
  ],
};

afterEach(() => jest.clearAllMocks());

describe('SupportTicketDetailPage (UC-SUPP-02 detalle)', () => {
  it('carga y muestra el asunto del ticket', async () => {
    apiService.get.mockResolvedValue({ data: TICKET_DETAIL });
    renderAt('/support/tickets/42', makeStore());
    expect(await screen.findByText(/Pedido tardio/)).toBeInTheDocument();
  });

  it('muestra el cuerpo original del ticket', async () => {
    apiService.get.mockResolvedValue({ data: TICKET_DETAIL });
    renderAt('/support/tickets/42', makeStore());
    expect(
      await screen.findByText(/Mi pedido lleva 10 dias sin llegar/)
    ).toBeInTheDocument();
  });

  it('renderiza el historial de respuestas en orden', async () => {
    apiService.get.mockResolvedValue({ data: TICKET_DETAIL });
    renderAt('/support/tickets/42', makeStore());
    expect(await screen.findByText(/Hola, revisamos tu pedido/)).toBeInTheDocument();
    expect(screen.getByText(/Gracias, sigo esperando/)).toBeInTheDocument();
  });

  it('muestra el estado del ticket en español', async () => {
    apiService.get.mockResolvedValue({ data: TICKET_DETAIL });
    renderAt('/support/tickets/42', makeStore());
    expect(await screen.findByText('Respondido')).toBeInTheDocument();
  });

  it('llama al endpoint con el id correcto', async () => {
    apiService.get.mockResolvedValue({ data: TICKET_DETAIL });
    renderAt('/support/tickets/42', makeStore());
    await screen.findByText(/Pedido tardio/);
    expect(apiService.get).toHaveBeenCalledWith(
      expect.stringContaining('/support/tickets/42/'),
      expect.anything(),
    );
  });
});
