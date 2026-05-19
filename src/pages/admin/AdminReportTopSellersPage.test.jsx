/**
 * Tests — AdminReportTopSellersPage
 * UC-REP-02: Reporte de productos mas vendidos (top sellers).
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import AdminReportTopSellersPage from './AdminReportTopSellersPage';

const RESPONSE = {
  results: [
    { product_id: 1, name: 'Falda Yoruba',   sku: 'FAL-001', units: 50, revenue: '5000.00', share_pct: 40 },
    { product_id: 2, name: 'Camisa Africana', sku: 'CAM-002', units: 30, revenue: '3000.00', share_pct: 24 },
  ],
  inactive_no_sales_pct: 18.5,
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

describe('AdminReportTopSellersPage (UC-REP-02)', () => {
  it('renderiza el titulo', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReportTopSellersPage />));
    expect(
      await screen.findByRole('heading', { name: /Top sellers/i }),
    ).toBeInTheDocument();
  });

  it('renderiza el ranking en una tabla', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReportTopSellersPage />));
    expect(await screen.findByText('Falda Yoruba')).toBeInTheDocument();
    expect(screen.getByText('Camisa Africana')).toBeInTheDocument();
    expect(screen.getByText('FAL-001')).toBeInTheDocument();
  });

  it('muestra los filtros de periodo y limite', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReportTopSellersPage />));
    expect(await screen.findByRole('combobox', { name: /Periodo/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Top N/i)).toBeInTheDocument();
  });

  it('cambia los parametros al cambiar el periodo', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReportTopSellersPage />));
    await screen.findByText('Falda Yoruba');
    fireEvent.change(
      screen.getByRole('combobox', { name: /Periodo/i }),
      { target: { value: 'quarter' } },
    );
    await waitFor(() => {
      expect(apiService.get).toHaveBeenLastCalledWith(
        '/api/v1/admin/reports/top-sellers/',
        expect.objectContaining({
          params: expect.objectContaining({ period: 'quarter' }),
        }),
      );
    });
  });

  it('muestra el porcentaje de productos sin ventas', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReportTopSellersPage />));
    expect(await screen.findByText(/18\.5/)).toBeInTheDocument();
  });

  it('tiene boton de exportar', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReportTopSellersPage />));
    expect(await screen.findByRole('link', { name: /Exportar CSV/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Exportar PDF/i })).toBeInTheDocument();
  });

  it('estado vacio cuando no hay ventas', async () => {
    apiService.get.mockResolvedValue({ data: { results: [], inactive_no_sales_pct: 0 } });
    render(wrap(<AdminReportTopSellersPage />));
    expect(await screen.findByText(/Sin ventas en el periodo/i)).toBeInTheDocument();
  });
});
