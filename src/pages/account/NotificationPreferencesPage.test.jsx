/**
 * Tests — NotificationPreferencesPage
 * UC-NOT-06: Gestionar Preferencias de Notificacion
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}));

import apiService from '@services/apiService';
import notificationsReducer from '@redux/slices/notificationsSlice';
import NotificationPreferencesPage from './NotificationPreferencesPage';

const makeStore = () =>
  configureStore({ reducer: { notifications: notificationsReducer } });

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (ui, store) => (
  <Provider store={store}>
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  </Provider>
);

const PREFERENCES = [
  { type: 'ORDER_CONFIRMATION',  enabled: true,  mandatory: true,  label: 'Confirmacion de orden' },
  { type: 'ORDER_STATUS',        enabled: true,  mandatory: true,  label: 'Estado de la orden' },
  { type: 'SHIPPING_UPDATE',     enabled: true,  mandatory: false, label: 'Actualizacion de envio' },
  { type: 'RETURN_PROCESSED',    enabled: false, mandatory: false, label: 'Devolucion procesada' },
  { type: 'REFUND_ISSUED',       enabled: true,  mandatory: false, label: 'Reembolso emitido' },
  { type: 'MARKETING',           enabled: false, mandatory: false, label: 'Promociones' },
];

afterEach(() => jest.clearAllMocks());

describe('NotificationPreferencesPage (UC-NOT-06)', () => {
  it('muestra el titulo de la pagina', async () => {
    apiService.get.mockResolvedValue({ data: { results: PREFERENCES } });
    render(wrap(<NotificationPreferencesPage />, makeStore()));
    expect(
      await screen.findByRole('heading', { name: /Preferencias de notificaci[oó]n/i }),
    ).toBeInTheDocument();
  });

  it('lista cada tipo de notificacion como un toggle', async () => {
    apiService.get.mockResolvedValue({ data: { results: PREFERENCES } });
    render(wrap(<NotificationPreferencesPage />, makeStore()));
    expect(await screen.findByLabelText(/Confirmacion de orden/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Actualizacion de envio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Promociones/i)).toBeInTheDocument();
  });

  it('marca como deshabilitados los toggles obligatorios', async () => {
    apiService.get.mockResolvedValue({ data: { results: PREFERENCES } });
    render(wrap(<NotificationPreferencesPage />, makeStore()));
    const mandatory = await screen.findByLabelText(/Confirmacion de orden/i);
    expect(mandatory).toBeDisabled();
    expect(mandatory).toBeChecked();
  });

  it('al guardar, hace PUT con la lista de preferencias actualizadas', async () => {
    apiService.get.mockResolvedValue({ data: { results: PREFERENCES } });
    apiService.put.mockResolvedValue({ data: { results: PREFERENCES } });
    render(wrap(<NotificationPreferencesPage />, makeStore()));

    const marketingToggle = await screen.findByLabelText(/Promociones/i);
    fireEvent.click(marketingToggle);
    fireEvent.click(screen.getByRole('button', { name: /Guardar preferencias/i }));

    await waitFor(() => {
      expect(apiService.put).toHaveBeenCalledWith(
        '/api/v1/notifications/preferences/',
        expect.objectContaining({
          preferences: expect.arrayContaining([
            expect.objectContaining({ type: 'MARKETING', enabled: true }),
          ]),
        }),
      );
    });
  });

  it('muestra un mensaje de exito tras guardar correctamente', async () => {
    apiService.get.mockResolvedValue({ data: { results: PREFERENCES } });
    apiService.put.mockResolvedValue({ data: { results: PREFERENCES } });
    render(wrap(<NotificationPreferencesPage />, makeStore()));
    fireEvent.click(await screen.findByRole('button', { name: /Guardar preferencias/i }));
    expect(
      await screen.findByText(/Preferencias guardadas/i),
    ).toBeInTheDocument();
  });

  it('ofrece desactivar todas las notificaciones opcionales de una vez', async () => {
    apiService.get.mockResolvedValue({ data: { results: PREFERENCES } });
    render(wrap(<NotificationPreferencesPage />, makeStore()));
    const optOutAll = await screen.findByRole('button', { name: /Desactivar todas las opcionales/i });
    fireEvent.click(optOutAll);
    // El toggle MARKETING (opcional) ahora debe estar desactivado
    const shippingToggle = screen.getByLabelText(/Actualizacion de envio/i);
    expect(shippingToggle).not.toBeChecked();
    // El toggle obligatorio permanece activo
    expect(screen.getByLabelText(/Confirmacion de orden/i)).toBeChecked();
  });
});
