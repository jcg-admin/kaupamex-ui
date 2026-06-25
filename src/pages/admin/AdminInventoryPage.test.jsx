/**
 * Tests — AdminInventoryPage
 * UC-INV-01: Ver stock actual de productos
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import inventoryReducer from '@redux/slices/inventorySlice';
import AdminInventoryPage from './AdminInventoryPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = () =>
  configureStore({ reducer: { inventory: inventoryReducer } });

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (ui, store) => (
  <Provider store={store}>
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  </Provider>
);

const ITEMS = [
  { variant_id: 10, product_id: 1, product_name: 'Vela Yoruba Roja',
    sku: 'SKU-001', stock: 12, min_threshold: 5, status: 'NORMAL' },
  { variant_id: 11, product_id: 2, product_name: 'Ifa Tablero',
    sku: 'SKU-002', stock: 2,  min_threshold: 5, status: 'BAJO' },
  { variant_id: 12, product_id: 3, product_name: 'Collar Eshu',
    sku: 'SKU-003', stock: 0,  min_threshold: 4, status: 'AGOTADO' },
];

const RESPONSE = {
  results: ITEMS,
  summary: { productos_normales: 1, productos_bajo_stock: 1, productos_agotados: 1 },
};

let lastInventoryUrl;

beforeEach(() => {
  lastInventoryUrl = undefined;
  server.use(
    http.get(`${BASE}/api/v2/admin/inventory/`, ({ request }) => {
      lastInventoryUrl = new URL(request.url);
      return HttpResponse.json(RESPONSE);
    }),
  );
});

describe('AdminInventoryPage (UC-INV-01)', () => {
  it('muestra el titulo del panel de inventario', async () => {
    render(wrap(<AdminInventoryPage />, makeStore()));
    expect(
      await screen.findByRole('heading', { name: /Inventario/i }),
    ).toBeInTheDocument();
  });

  it('renderiza una fila por cada variante con su SKU y stock', async () => {
    render(wrap(<AdminInventoryPage />, makeStore()));
    expect(await screen.findByText('SKU-001')).toBeInTheDocument();
    expect(screen.getByText('SKU-002')).toBeInTheDocument();
    expect(screen.getByText('SKU-003')).toBeInTheDocument();
    expect(screen.getByText('Vela Yoruba Roja')).toBeInTheDocument();
  });

  it('muestra el panel resumen con conteos por estado', async () => {
    render(wrap(<AdminInventoryPage />, makeStore()));
    await screen.findByText('SKU-001');
    const summary = screen.getByLabelText(/Resumen de inventario/i);
    expect(summary).toHaveTextContent(/Normales/i);
    expect(summary).toHaveTextContent(/Bajo stock/i);
    expect(summary).toHaveTextContent(/Agotados/i);
  });

  it('marca visualmente las variantes BAJO y AGOTADO', async () => {
    render(wrap(<AdminInventoryPage />, makeStore()));
    await screen.findByText('SKU-001');
    const bajoMatches    = screen.getAllByText('Bajo');
    const agotadoMatches = screen.getAllByText('Agotado');
    expect(bajoMatches.length).toBeGreaterThan(0);
    expect(agotadoMatches.length).toBeGreaterThan(0);
  });

  it('filtra por estado al cambiar el selector', async () => {
    render(wrap(<AdminInventoryPage />, makeStore()));
    await screen.findByText('SKU-001');

    fireEvent.change(screen.getByLabelText(/Estado/i),
      { target: { value: 'BAJO' } });

    await waitFor(() => {
      expect(lastInventoryUrl?.searchParams.get('status')).toBe('BAJO');
    });
  });

  it('cada fila enlaza a la pagina de ajuste y a movimientos', async () => {
    render(wrap(<AdminInventoryPage />, makeStore()));
    const adjustLinks = await screen.findAllByRole('link', { name: /Ajustar/i });
    expect(adjustLinks[0]).toHaveAttribute('href', '/admin/inventory/10/adjust');
    const movLinks = screen.getAllByRole('link', { name: /Movimientos/i });
    expect(movLinks[0]).toHaveAttribute('href', '/admin/inventory/10/movements');
  });

  it('muestra estado vacio si no hay variantes', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/inventory/`, () =>
        HttpResponse.json({ results: [], summary: null }),
      ),
    );
    render(wrap(<AdminInventoryPage />, makeStore()));
    expect(
      await screen.findByText(/No hay productos en inventario/i),
    ).toBeInTheDocument();
  });
});
