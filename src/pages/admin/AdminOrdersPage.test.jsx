/**
 * Tests — AdminOrdersPage (UC-ORD-09 — listado/filtro admin)
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

const BASE = process.env.API_URL || 'http://localhost:8000';

// DateRangePicker se mockea con un control mínimo: dos inputs de texto que
// invocan onRangeChange con Dates. Así el test verifica el cableado de la
// página (?from=&to=) sin depender de la interacción de dos clics del
// Calendar real (eso ya lo cubre DateRangePicker.test.jsx).
jest.mock('@components/common/DatePicker/DateRangePicker', () => ({
  __esModule: true,
  DateRangePicker: ({ onRangeChange }) => (
    <button
      type="button"
      data-testid="mock-range"
      onClick={() =>
        onRangeChange({
          startDate: new Date(2026, 4, 1),
          endDate: new Date(2026, 4, 31),
        })
      }
    >
      Aplicar rango
    </button>
  ),
}));

import adminReducer from '@redux/slices/adminSlice';
import AdminOrdersPage from './AdminOrdersPage';

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

function buildStore() {
  return configureStore({
    reducer: { admin: adminReducer },
  });
}

const wrap = (ui) => (
  <Provider store={buildStore()}>
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  </Provider>
);

const ORDERS = [
  {
    order_number: 'PY-2026-000101', status: 'PENDING',
    status_display: 'Pendiente',
    created_at: '2026-05-10T10:00:00Z',
    value: { total: '1249.00' },
    user_email: 'cliente@example.com',
  },
  {
    order_number: 'PY-2026-000102', status: 'SHIPPED',
    status_display: 'Enviado',
    created_at: '2026-05-09T10:00:00Z',
    value: { total: '599.00' },
    guest_email: 'invitado@example.com',
  },
];

describe('AdminOrdersPage (UC-ORD-09)', () => {
  let lastUrl;

  it('muestra el titulo de la pagina', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/orders/`, () =>
        HttpResponse.json({ results: ORDERS, count: 2 }),
      ),
    );
    render(wrap(<AdminOrdersPage />));
    expect(
      await screen.findByRole('heading', { name: /Pedidos/i })
    ).toBeInTheDocument();
  });

  it('renderiza la tabla con las ordenes', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/orders/`, () =>
        HttpResponse.json({ results: ORDERS, count: 2 }),
      ),
    );
    render(wrap(<AdminOrdersPage />));
    expect(await screen.findByText('PY-2026-000101')).toBeInTheDocument();
    expect(screen.getByText('PY-2026-000102')).toBeInTheDocument();
    expect(screen.getByText('cliente@example.com')).toBeInTheDocument();
    // guest_email renders in both the username slot and the email slot — use getAllByText
    expect(screen.getAllByText('invitado@example.com').length).toBeGreaterThan(0);
  });

  it('aplica filtros de estado al endpoint admin', async () => {
    lastUrl = undefined;
    server.use(
      http.get(`${BASE}/api/v2/admin/orders/`, ({ request }) => {
        lastUrl = new URL(request.url);
        return HttpResponse.json({ results: ORDERS, count: 2 });
      }),
    );
    const user = userEvent.setup();
    render(wrap(<AdminOrdersPage />));

    await screen.findByText('PY-2026-000101');

    // Click the "Procesando" status filter button
    await user.click(screen.getByRole('button', { name: /Procesando/i }));

    await waitFor(() =>
      expect(lastUrl?.searchParams.get('status')).toBe('PROCESSING'),
    );
  });

  it('aplica el rango de fechas (from/to) al endpoint admin', async () => {
    lastUrl = undefined;
    server.use(
      http.get(`${BASE}/api/v2/admin/orders/`, ({ request }) => {
        lastUrl = new URL(request.url);
        return HttpResponse.json({ results: ORDERS, count: 2 });
      }),
    );
    const user = userEvent.setup();
    render(wrap(<AdminOrdersPage />));

    await screen.findByText('PY-2026-000101');

    await user.click(screen.getByTestId('mock-range'));

    await waitFor(() => {
      expect(lastUrl?.searchParams.get('from')).toBe('2026-05-01');
      expect(lastUrl?.searchParams.get('to')).toBe('2026-05-31');
    });
  });

  it('enlaza al detalle admin de cada orden', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/orders/`, () =>
        HttpResponse.json({ results: ORDERS, count: 2 }),
      ),
    );
    render(wrap(<AdminOrdersPage />));
    await screen.findByText('PY-2026-000101');
    const link = screen.getByRole('link', { name: 'PY-2026-000101' });
    expect(link).toHaveAttribute('href', '/admin/orders/PY-2026-000101');
  });
});
