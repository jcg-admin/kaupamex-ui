/**
 * Tests — AdminInventoryMovementsPage
 * UC-INV-02: Decremento de stock (movimientos tipo SALE)
 * UC-INV-03: Restauración de stock (movimientos tipo CANCELLATION)
 */
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

const BASE = process.env.API_URL || 'http://localhost:8000';

import inventoryReducer from '@redux/slices/inventorySlice';
import AdminInventoryMovementsPage from './AdminInventoryMovementsPage';

const makeStore = () =>
  configureStore({ reducer: { inventory: inventoryReducer } });

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (store) => (
  <Provider store={store}>
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter initialEntries={['/admin/inventory/10/movements']}>
        <Routes>
          <Route path="/admin/inventory/:variantId/movements"
                 element={<AdminInventoryMovementsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  </Provider>
);

// H-CICLO36-02: StockMovementSerializer expone movement_type (no "type").
// El valor de ajuste manual es ADJUSTMENT (no MANUAL).
const MOVEMENTS = [
  { id: 1, movement_type: 'SALE',         delta: -2, stock_after: 8,
    reference: 'ORD-100', created_at: '2026-05-01T10:00:00Z' },
  { id: 2, movement_type: 'CANCELLATION', delta:  2, stock_after: 10,
    reference: 'ORD-100', created_at: '2026-05-02T10:00:00Z' },
  { id: 3, movement_type: 'ADJUSTMENT',   delta: -1, stock_after: 9,
    reference: 'ADMIN:5', reason: 'LOSS',
    created_at: '2026-05-03T10:00:00Z' },
];

describe('AdminInventoryMovementsPage (UC-INV-02 / UC-INV-03)', () => {
  it('muestra el titulo de la pagina de movimientos', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/inventory/variants/10/movements/`, () =>
        HttpResponse.json({ results: MOVEMENTS }),
      ),
    );
    render(wrap(makeStore()));
    expect(
      await screen.findByRole('heading', { name: /Movimientos de inventario/i }),
    ).toBeInTheDocument();
  });

  it('UC-INV-02: muestra los movimientos tipo SALE (venta)', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/inventory/variants/10/movements/`, () =>
        HttpResponse.json({ results: MOVEMENTS }),
      ),
    );
    render(wrap(makeStore()));
    expect(await screen.findByText('Venta')).toBeInTheDocument();
    // delta negativo formateado
    expect(await screen.findByText('-2')).toBeInTheDocument();
  });

  it('UC-INV-03: muestra los movimientos tipo CANCELLATION (cancelacion)', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/inventory/variants/10/movements/`, () =>
        HttpResponse.json({ results: MOVEMENTS }),
      ),
    );
    render(wrap(makeStore()));
    expect(await screen.findByText(/Cancelaci[oó]n/i)).toBeInTheDocument();
    // delta positivo
    expect(await screen.findByText('+2')).toBeInTheDocument();
  });

  it('llama al endpoint de movimientos con el variantId de la URL', async () => {
    let getCalled = false;
    server.use(
      http.get(`${BASE}/api/v1/admin/inventory/variants/10/movements/`, () => {
        getCalled = true;
        return HttpResponse.json({ results: [] });
      }),
    );
    render(wrap(makeStore()));
    await screen.findByText(/Sin movimientos/i);
    expect(getCalled).toBe(true);
  });

  it('muestra estado vacio si la variante no tiene movimientos', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/inventory/variants/10/movements/`, () =>
        HttpResponse.json({ results: [] }),
      ),
    );
    render(wrap(makeStore()));
    expect(
      await screen.findByText(/Sin movimientos registrados/i),
    ).toBeInTheDocument();
  });

  it('cada fila muestra la referencia (orden o admin)', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/inventory/variants/10/movements/`, () =>
        HttpResponse.json({ results: MOVEMENTS }),
      ),
    );
    render(wrap(makeStore()));
    expect(await screen.findAllByText('ORD-100')).toHaveLength(2);
    expect(screen.getByText('ADMIN:5')).toBeInTheDocument();
  });

  // UC-INV-03 — filtro por tipo para ver solo cancelaciones
  it('UC-INV-03: filtra los movimientos por tipo (solo cancelaciones)', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/inventory/variants/10/movements/`, () =>
        HttpResponse.json({ results: MOVEMENTS }),
      ),
    );
    render(wrap(makeStore()));
    await screen.findByText('Venta');

    fireEvent.change(screen.getByLabelText(/Filtrar por tipo/i),
      { target: { value: 'CANCELLATION' } });

    // La venta desaparece de la tabla; "Cancelación" sigue ahí
    const table = screen.getByRole('table');
    expect(table).not.toHaveTextContent('Venta');
    expect(table).toHaveTextContent('Cancelación');
  });

  // Migración a DataTable: la tabla ahora soporta ordenamiento por columna.
  // Verifica el sort por Delta (numérico) sobre los movimientos en memoria.
  it('ordena los movimientos por delta al hacer clic en el header', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/inventory/variants/10/movements/`, () =>
        HttpResponse.json({ results: MOVEMENTS }),
      ),
    );
    render(wrap(makeStore()));
    // Esperar a que la tabla (no la <option> "Venta") esté montada: el botón
    // de orden de la columna Delta solo existe cuando DataTable renderizó.
    await screen.findByRole('button', { name: /Delta/i });

    function deltaCells() {
      // La columna Delta es la 3a celda (índice 2) de cada fila de datos.
      return screen.getAllByRole('row')
        .slice(1)
        .map((r) => within(r).queryAllByRole('cell')[2]?.textContent)
        .filter(Boolean);
    }

    // Orden natural (orden de llegada): -2, +2, -1.
    expect(deltaCells()).toEqual(['-2', '+2', '-1']);

    // Ordenar ascendente por Delta: -2, -1, +2.
    fireEvent.click(screen.getByRole('button', { name: /Delta/i }));
    expect(deltaCells()).toEqual(['-2', '-1', '+2']);

    // Ordenar descendente: +2, -1, -2.
    fireEvent.click(screen.getByRole('button', { name: /Delta/i }));
    expect(deltaCells()).toEqual(['+2', '-1', '-2']);
  });
});
