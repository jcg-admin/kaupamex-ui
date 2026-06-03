/**
 * Tests — AdminOrdersPage (UC-ORD-09 — listado/filtro admin)
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

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

import apiService from '@services/apiService';
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

afterEach(() => jest.clearAllMocks());

describe('AdminOrdersPage (UC-ORD-09)', () => {
  it('muestra el titulo de la pagina', async () => {
    apiService.get.mockResolvedValue({ data: { results: ORDERS, count: 2 } });
    render(wrap(<AdminOrdersPage />));
    expect(
      await screen.findByRole('heading', { name: /Pedidos/i })
    ).toBeInTheDocument();
  });

  it('renderiza la tabla con las ordenes', async () => {
    apiService.get.mockResolvedValue({ data: { results: ORDERS, count: 2 } });
    render(wrap(<AdminOrdersPage />));
    expect(await screen.findByText('PY-2026-000101')).toBeInTheDocument();
    expect(screen.getByText('PY-2026-000102')).toBeInTheDocument();
    expect(screen.getByText('cliente@example.com')).toBeInTheDocument();
    // guest_email renders in both the username slot and the email slot — use getAllByText
    expect(screen.getAllByText('invitado@example.com').length).toBeGreaterThan(0);
  });

  it('aplica filtros de estado al endpoint admin', async () => {
    apiService.get.mockResolvedValue({ data: { results: ORDERS, count: 2 } });
    const user = userEvent.setup();
    render(wrap(<AdminOrdersPage />));

    await screen.findByText('PY-2026-000101');

    // Click the "Procesando" status filter button
    await user.click(screen.getByRole('button', { name: /Procesando/i }));

    await waitFor(() => {
      expect(apiService.get).toHaveBeenLastCalledWith(
        '/api/v1/admin/orders/',
        expect.objectContaining({
          params: expect.objectContaining({
            status: 'PROCESSING',
          }),
        }),
      );
    });
  });

  it('aplica el rango de fechas (from/to) al endpoint admin', async () => {
    apiService.get.mockResolvedValue({ data: { results: ORDERS, count: 2 } });
    const user = userEvent.setup();
    render(wrap(<AdminOrdersPage />));

    await screen.findByText('PY-2026-000101');

    await user.click(screen.getByTestId('mock-range'));

    await waitFor(() => {
      expect(apiService.get).toHaveBeenLastCalledWith(
        '/api/v1/admin/orders/',
        expect.objectContaining({
          params: expect.objectContaining({
            from: '2026-05-01',
            to:   '2026-05-31',
          }),
        }),
      );
    });
  });

  it('enlaza al detalle admin de cada orden', async () => {
    apiService.get.mockResolvedValue({ data: { results: ORDERS, count: 2 } });
    render(wrap(<AdminOrdersPage />));
    await screen.findByText('PY-2026-000101');
    const link = screen.getByRole('link', { name: 'PY-2026-000101' });
    expect(link).toHaveAttribute('href', '/admin/pedidos/PY-2026-000101');
  });
});
