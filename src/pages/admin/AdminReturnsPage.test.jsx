/**
 * Tests — AdminReturnsPage
 * UC-RET-05: Ver devoluciones pendientes (Admin)
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
import returnsReducer from '@redux/slices/returnsSlice';
import AdminReturnsPage from './AdminReturnsPage';

const makeStore = () =>
  configureStore({ reducer: { returns: returnsReducer } });

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (ui, store) => (
  <Provider store={store}>
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  </Provider>
);

const RETURNS = [
  { id: 200, order_id: 'ORD-A', status: 'PENDIENTE_REVISION', created_at: '2026-05-01T10:00:00Z',
    customer: { id: 1, email: 'demo@test.mx', name: 'Demo Yoruba' }, reason: 'PRODUCTO_DANADO' },
  { id: 201, order_id: 'ORD-B', status: 'APROBADA',           created_at: '2026-05-02T10:00:00Z',
    customer: { id: 2, email: 'maria@test.mx', name: 'María L.' }, reason: 'NO_COINCIDE_DESCRIPCION' },
  { id: 202, order_id: 'ORD-C', status: 'PENDIENTE_INFORMACION', created_at: '2026-05-03T10:00:00Z',
    customer: { id: 3, email: 'juan@test.mx', name: 'Juan D.' }, reason: 'OTRO' },
];

const RESPONSE = {
  results: RETURNS,
  metrics: { pendientes: 1, aprobadas: 1, pendiente_info: 1 },
};

afterEach(() => jest.clearAllMocks());

describe('AdminReturnsPage (UC-RET-05)', () => {
  it('muestra el titulo de la bandeja', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReturnsPage />, makeStore()));
    expect(
      await screen.findByRole('heading', { name: /Devoluciones pendientes/i })
    ).toBeInTheDocument();
  });

  it('renderiza la tabla con todas las devoluciones', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReturnsPage />, makeStore()));
    expect(await screen.findByText('ORD-A')).toBeInTheDocument();
    expect(screen.getByText('ORD-B')).toBeInTheDocument();
    expect(screen.getByText('ORD-C')).toBeInTheDocument();
  });

  it('muestra el email del comprador en cada fila', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReturnsPage />, makeStore()));
    expect(await screen.findByText('demo@test.mx')).toBeInTheDocument();
    expect(screen.getByText('maria@test.mx')).toBeInTheDocument();
  });

  it('muestra el panel de métricas con los conteos por estado', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReturnsPage />, makeStore()));
    await screen.findByText('ORD-A');
    const metricsPanel = screen.getByLabelText(/Conteo por estado/i);
    expect(metricsPanel).toHaveTextContent(/Pendientes de revisión/i);
    expect(metricsPanel).toHaveTextContent(/Aprobadas/i);
    expect(metricsPanel).toHaveTextContent(/Pendiente de información/i);
  });

  it('filtra el listado por estado al cambiar el selector', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReturnsPage />, makeStore()));
    await screen.findByText('ORD-A');

    fireEvent.change(screen.getByRole('combobox'),
      { target: { value: 'PENDIENTE_REVISION' } });

    await waitFor(() => {
      expect(apiService.get).toHaveBeenLastCalledWith(
        expect.stringContaining('/admin/returns/'),
        expect.objectContaining({
          params: expect.objectContaining({ status: 'PENDIENTE_REVISION' }),
        }),
      );
    });
  });

  it('muestra estado vacio cuando no hay devoluciones', async () => {
    apiService.get.mockResolvedValue({ data: { results: [], metrics: null } });
    render(wrap(<AdminReturnsPage />, makeStore()));
    expect(
      await screen.findByText(/No hay devoluciones pendientes/i)
    ).toBeInTheDocument();
  });

  it('cada fila enlaza a su detalle admin', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReturnsPage />, makeStore()));
    const links = await screen.findAllByRole('link', { name: /Ver detalle/i });
    expect(links).toHaveLength(RETURNS.length);
    expect(links[0]).toHaveAttribute('href', '/admin/returns/200');
  });
});
