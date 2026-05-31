/**
 * Tests AdminDashboardPage — landing del panel admin.
 *
 * Verifica:
 *   - renderiza titulo
 *   - muestra KPIs alimentados por fetchAdminMetrics
 *   - tolera error de carga
 *   - expone enlaces de navegacion
 */
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

import apiService from '@services/apiService';
import adminReducer from '@redux/slices/adminSlice';
import AdminDashboardPage from './AdminDashboardPage';

const makeStore = () =>
  configureStore({ reducer: { admin: adminReducer } });

function renderPage() {
  const store = makeStore();
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    </Provider>,
  );
}

afterEach(() => jest.clearAllMocks());

describe('AdminDashboardPage — landing admin', () => {
  it('renderiza titulo del panel', async () => {
    apiService.get.mockResolvedValueOnce({ data: {} });
    renderPage();
    expect(
      await screen.findByRole('heading', { name: /Resumen del día/i }),
    ).toBeInTheDocument();
  });

  it('muestra KPIs cuando el endpoint responde con datos', async () => {
    apiService.get.mockResolvedValueOnce({
      data: {
        today: { revenue: 12345, orders: 9 },
        top_products: [],
        open_tickets: 0,
        low_stock_alerts: 0,
      },
    });
    renderPage();
    // KPI labels are rendered
    expect(await screen.findByText(/Ventas del día/i)).toBeInTheDocument();
    expect(screen.getByText(/Pedidos del día/i)).toBeInTheDocument();
  });

  it('tolera error de carga del dashboard', async () => {
    apiService.get.mockRejectedValueOnce(new Error('boom'));
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('alert')).toBeInTheDocument(),
    );
  });

  it('lista enlaces de navegacion a las secciones del admin', async () => {
    apiService.get.mockResolvedValueOnce({ data: {} });
    renderPage();
    // The dashboard has a "Ver todos" link to pedidos
    await screen.findByRole('heading', { name: /Resumen del día/i });
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });
});
