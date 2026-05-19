/**
 * Tests — AdminReportCustomersRfmPage
 * UC-REP-04: Reporte de clientes con analisis RFM.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import AdminReportCustomersRfmPage from './AdminReportCustomersRfmPage';

const RESPONSE = {
  results: [
    { customer_id: 1, email: 'vip@example.com',  name: 'Cliente VIP',  segment: 'VIP',       recency: 3,  frequency: 12, monetary: '5400.00' },
    { customer_id: 2, email: 'new@example.com',  name: 'Cliente Nuevo', segment: 'NEW',      recency: 5,  frequency: 1,  monetary: '120.00'  },
    { customer_id: 3, email: 'lost@example.com', name: 'Inactivo',     segment: 'INACTIVE', recency: 200, frequency: 1, monetary: '80.00'   },
  ],
  totals: { new_count: 1, returning_count: 2 },
};

const wrap = (ui) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

afterEach(() => jest.clearAllMocks());

describe('AdminReportCustomersRfmPage (UC-REP-04)', () => {
  it('renderiza el titulo', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReportCustomersRfmPage />));
    expect(
      await screen.findByRole('heading', { name: /Clientes \(RFM\)/i }),
    ).toBeInTheDocument();
  });

  it('renderiza la tabla con compradores y su segmento', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReportCustomersRfmPage />));
    expect(await screen.findByText('vip@example.com')).toBeInTheDocument();
    expect(screen.getByText('new@example.com')).toBeInTheDocument();
    expect(screen.getByText('lost@example.com')).toBeInTheDocument();
    expect(screen.getAllByText(/VIP/i).length).toBeGreaterThan(0);
  });

  it('muestra los filtros de segmento y periodo', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReportCustomersRfmPage />));
    expect(await screen.findByRole('combobox', { name: /Periodo/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Segmento/i })).toBeInTheDocument();
  });

  it('filtra por segmento al cambiar el selector', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReportCustomersRfmPage />));
    await screen.findByText('vip@example.com');
    fireEvent.change(
      screen.getByRole('combobox', { name: /Segmento/i }),
      { target: { value: 'VIP' } },
    );
    await waitFor(() => {
      expect(apiService.get).toHaveBeenLastCalledWith(
        '/api/v1/admin/reports/customers-rfm/',
        expect.objectContaining({
          params: expect.objectContaining({ segment: 'VIP' }),
        }),
      );
    });
  });

  it('muestra totales de nuevos vs recurrentes', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReportCustomersRfmPage />));
    await screen.findByText('vip@example.com');
    const totals = screen.getByLabelText(/Totales de clientes/i);
    expect(totals).toHaveTextContent(/Nuevos/i);
    expect(totals).toHaveTextContent(/Recurrentes/i);
  });

  it('tiene boton de exportar', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReportCustomersRfmPage />));
    expect(await screen.findByRole('link', { name: /Exportar CSV/i })).toBeInTheDocument();
  });

  it('estado vacio cuando no hay clientes', async () => {
    apiService.get.mockResolvedValue({ data: { results: [], totals: { new_count: 0, returning_count: 0 } } });
    render(wrap(<AdminReportCustomersRfmPage />));
    expect(await screen.findByText(/Sin clientes en el periodo/i)).toBeInTheDocument();
  });
});
