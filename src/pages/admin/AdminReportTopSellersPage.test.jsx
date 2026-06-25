/**
 * Tests — AdminReportTopSellersPage
 * UC-REP-02: Reporte de productos mas vendidos (top sellers).
 */
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

const BASE = process.env.API_URL || 'http://localhost:8000';

import AdminReportTopSellersPage from './AdminReportTopSellersPage';

const RESPONSE = {
  results: [
    { product_id: 1, product_name: 'Falda Yoruba',   sku: 'FAL-001', units_sold: 50, revenue: '5000.00', share_pct: 40 },
    { product_id: 2, product_name: 'Camisa Africana', sku: 'CAM-002', units_sold: 30, revenue: '3000.00', share_pct: 24 },
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

describe('AdminReportTopSellersPage (UC-REP-02)', () => {
  it('renderiza el titulo', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/reports/top-sellers/`, () => HttpResponse.json(RESPONSE)),
    );
    render(wrap(<AdminReportTopSellersPage />));
    expect(
      await screen.findByRole('heading', { name: /Top sellers/i }),
    ).toBeInTheDocument();
  });

  it('renderiza el ranking en una tabla', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/reports/top-sellers/`, () => HttpResponse.json(RESPONSE)),
    );
    render(wrap(<AdminReportTopSellersPage />));
    expect(await screen.findByText('Falda Yoruba')).toBeInTheDocument();
    expect(screen.getByText('Camisa Africana')).toBeInTheDocument();
    expect(screen.getByText('FAL-001')).toBeInTheDocument();
  });

  it('muestra los filtros de periodo y limite', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/reports/top-sellers/`, () => HttpResponse.json(RESPONSE)),
    );
    render(wrap(<AdminReportTopSellersPage />));
    expect(await screen.findByRole('combobox', { name: /Periodo/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Top N/i)).toBeInTheDocument();
  });

  it('cambia los parametros al cambiar el periodo', async () => {
    let lastUrl;
    server.use(
      http.get(`${BASE}/api/v2/admin/reports/top-sellers/`, ({ request }) => {
        lastUrl = new URL(request.url);
        return HttpResponse.json(RESPONSE);
      }),
    );
    render(wrap(<AdminReportTopSellersPage />));
    await screen.findByText('Falda Yoruba');
    fireEvent.change(
      screen.getByRole('combobox', { name: /Periodo/i }),
      { target: { value: 'quarter' } },
    );
    await waitFor(() => {
      expect(lastUrl?.searchParams.get('period')).toBe('quarter');
    });
  });

  it('muestra el porcentaje de productos sin ventas', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/reports/top-sellers/`, () => HttpResponse.json(RESPONSE)),
    );
    render(wrap(<AdminReportTopSellersPage />));
    expect(await screen.findByText(/18\.5/)).toBeInTheDocument();
  });

  it('tiene boton de exportar', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/reports/top-sellers/`, () => HttpResponse.json(RESPONSE)),
    );
    render(wrap(<AdminReportTopSellersPage />));
    expect(await screen.findByRole('link', { name: /Exportar CSV/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Exportar PDF/i })).toBeInTheDocument();
  });

  it('estado vacio cuando no hay ventas', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/reports/top-sellers/`, () =>
        HttpResponse.json({ results: [], inactive_no_sales_pct: 0 }),
      ),
    );
    render(wrap(<AdminReportTopSellersPage />));
    expect(await screen.findByText(/Sin ventas en el periodo/i)).toBeInTheDocument();
  });

  // Migración a DataTable: el ranking se renderiza en una tabla reutilizable
  // con ordenamiento por columna (cliente). Verifica la interacción de sort.
  it('ordena el ranking por producto al hacer clic en el header', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/reports/top-sellers/`, () => HttpResponse.json(RESPONSE)),
    );
    render(wrap(<AdminReportTopSellersPage />));
    await screen.findByText('Falda Yoruba');

    function dataRowFirstCells() {
      return screen.getAllByRole('row')
        .slice(1) // row[0] es el header
        .map((r) => within(r).queryAllByRole('cell')[1]?.textContent) // col Producto
        .filter(Boolean);
    }

    // Orden natural por ranking: Falda (1), Camisa (2).
    expect(dataRowFirstCells()).toEqual(['Falda Yoruba', 'Camisa Africana']);

    // Ordenar ascendente por Producto → Camisa antes que Falda.
    fireEvent.click(screen.getByRole('button', { name: /Producto/i }));
    expect(dataRowFirstCells()).toEqual(['Camisa Africana', 'Falda Yoruba']);

    // El header expone el estado de orden accesible.
    expect(
      screen.getByRole('button', { name: /Producto/i }).closest('th'),
    ).toHaveAttribute('aria-sort', 'ascending');
  });
});
