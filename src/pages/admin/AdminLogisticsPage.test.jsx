/**
 * Tests — AdminLogisticsPage (UC-LOG-08)
 *
 *   GET  /api/v1/logistics/                                — panel de envios pendientes
 *   POST /api/v1/logistics/guides/:guideId/confirm-delivery/ — UC-LOG-05
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import logisticsReducer from '@redux/slices/logisticsSlice';
import AdminLogisticsPage from './AdminLogisticsPage';

const PANEL = {
  group_a: [
    {
      order_id:   501,
      order_number: 'ORD-0501',
      buyer_username: 'maria.lopez',
      created_at: '2026-05-18T10:00:00Z',
    },
    {
      order_id:   502,
      order_number: 'ORD-0502',
      buyer_username: 'juan.perez',
      created_at: '2026-05-18T11:30:00Z',
    },
  ],
  group_b: [
    {
      guide_id:        700,
      order_number:    'ORD-0490',
      courier_name:    'Estafeta',
      tracking_number: 'EST123456',
      last_status:     'EN_TRANSITO',
      last_event_at:   '2026-05-19T08:00:00Z',
    },
    {
      guide_id:        701,
      order_number:    'ORD-0491',
      courier_name:    'DHL',
      tracking_number: null,
      last_status:     'GUIA_CREADA',
      last_event_at:   '2026-05-18T20:00:00Z',
    },
  ],
};

const wrap = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const store = configureStore({ reducer: { logistics: logisticsReducer } });
  return (
    <QueryClientProvider client={client}>
      <Provider store={store}>
        <MemoryRouter>
          <AdminLogisticsPage />
        </MemoryRouter>
      </Provider>
    </QueryClientProvider>
  );
};

afterEach(() => jest.clearAllMocks());

describe('AdminLogisticsPage (UC-LOG-08)', () => {
  it('muestra el titulo de Logistica y los dos grupos', async () => {
    apiService.get.mockResolvedValue({ data: PANEL });
    render(wrap());
    expect(
      await screen.findByRole('heading', { name: /Logistica/i, level: 1 }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: /Pendientes de despacho/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /En transito/i })).toBeInTheDocument();
  });

  it('lista las ordenes del Grupo A con accion Crear guia', async () => {
    apiService.get.mockResolvedValue({ data: PANEL });
    render(wrap());
    expect(await screen.findByText('ORD-0501')).toBeInTheDocument();
    expect(screen.getByText('ORD-0502')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Crear guia/i }).length).toBeGreaterThanOrEqual(1);
  });

  it('lista los envios del Grupo B con courier y tracking', async () => {
    apiService.get.mockResolvedValue({ data: PANEL });
    render(wrap());
    expect(await screen.findByText('ORD-0490')).toBeInTheDocument();
    expect(screen.getByText('Estafeta')).toBeInTheDocument();
    expect(screen.getByText('EST123456')).toBeInTheDocument();
    expect(screen.getByText('DHL')).toBeInTheDocument();
  });

  it('confirma entrega manual via POST /api/v1/logistics/guides/:id/confirm-delivery/', async () => {
    apiService.get.mockResolvedValue({ data: PANEL });
    apiService.post.mockResolvedValue({ data: { ok: true } });
    render(wrap());
    await screen.findByText('ORD-0490');

    const buttons = screen.getAllByRole('button', { name: /Confirmar entrega/i });
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/logistics/guides/700/confirm-delivery/',
      );
    });
  });

  it('muestra mensaje cuando ambos grupos estan vacios', async () => {
    apiService.get.mockResolvedValue({ data: { group_a: [], group_b: [] } });
    render(wrap());
    expect(
      await screen.findByText(/No hay envios pendientes/i),
    ).toBeInTheDocument();
  });

  it('muestra error cuando falla la consulta', async () => {
    apiService.get.mockRejectedValue(new Error('boom'));
    render(wrap());
    expect(
      await screen.findByText(/No se pudo cargar el panel/i),
    ).toBeInTheDocument();
  });
});
