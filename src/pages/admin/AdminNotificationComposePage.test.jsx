/**
 * Tests — AdminNotificationComposePage
 * UC-NOT-07: Enviar notificacion manual a usuario (admin).
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import notificationsReducer from '@redux/slices/notificationsSlice';
import AdminNotificationComposePage from './AdminNotificationComposePage';

const makeStore = () =>
  configureStore({ reducer: { notifications: notificationsReducer } });

const wrap = (ui, store) => (
  <Provider store={store}>
    <MemoryRouter>{ui}</MemoryRouter>
  </Provider>
);

afterEach(() => jest.clearAllMocks());

describe('AdminNotificationComposePage (UC-NOT-07)', () => {
  it('muestra el titulo del compositor', () => {
    render(wrap(<AdminNotificationComposePage />, makeStore()));
    expect(
      screen.getByRole('heading', { name: /Notificaci[oó]n manual/i }),
    ).toBeInTheDocument();
  });

  it('ofrece destinatario por email, orden o producto', () => {
    render(wrap(<AdminNotificationComposePage />, makeStore()));
    const select = screen.getByLabelText(/Tipo de destinatario/i);
    expect(select.querySelectorAll('option')).toHaveLength(3);
    expect(select).toHaveTextContent(/Email/i);
    expect(select).toHaveTextContent(/Orden/i);
    expect(select).toHaveTextContent(/Producto/i);
  });

  it('requiere asunto y mensaje antes de enviar', () => {
    render(wrap(<AdminNotificationComposePage />, makeStore()));
    fireEvent.click(screen.getByRole('button', { name: /Enviar notificaci[oó]n/i }));
    expect(apiService.post).not.toHaveBeenCalled();
    expect(screen.getByText(/El asunto es obligatorio/i)).toBeInTheDocument();
  });

  it('al enviar, hace POST con destinatario, asunto y mensaje', async () => {
    apiService.post.mockResolvedValue({
      data: { id: 99, recipients_count: 1, status: 'SENT' },
    });
    render(wrap(<AdminNotificationComposePage />, makeStore()));

    fireEvent.change(screen.getByLabelText(/Tipo de destinatario/i),
      { target: { value: 'EMAIL' } });
    fireEvent.change(screen.getByLabelText(/Identificador del destinatario/i),
      { target: { value: 'cliente@example.com' } });
    fireEvent.change(screen.getByLabelText(/Asunto/i),
      { target: { value: 'Su pedido ha sido revisado' } });
    fireEvent.change(screen.getByLabelText(/Mensaje/i),
      { target: { value: 'Hola, le confirmamos que su caso ya fue atendido.' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar notificaci[oó]n/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/admin/notifications/manual/',
        expect.objectContaining({
          recipient_type:       'EMAIL',
          recipient_identifier: 'cliente@example.com',
          subject:              'Su pedido ha sido revisado',
          message:              'Hola, le confirmamos que su caso ya fue atendido.',
        }),
      );
    });
  });

  it('muestra mensaje de exito tras un envio correcto', async () => {
    apiService.post.mockResolvedValue({
      data: { id: 99, recipients_count: 1, status: 'SENT' },
    });
    render(wrap(<AdminNotificationComposePage />, makeStore()));

    fireEvent.change(screen.getByLabelText(/Identificador del destinatario/i),
      { target: { value: 'cliente@example.com' } });
    fireEvent.change(screen.getByLabelText(/Asunto/i),
      { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/Mensaje/i),
      { target: { value: 'Cuerpo del mensaje' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar notificaci[oó]n/i }));

    expect(
      await screen.findByText(/Notificaci[oó]n enviada/i),
    ).toBeInTheDocument();
  });

  it('muestra el conteo de destinatarios cuando se elige PRODUCT', async () => {
    apiService.get.mockResolvedValue({ data: { count: 42 } });
    render(wrap(<AdminNotificationComposePage />, makeStore()));

    fireEvent.change(screen.getByLabelText(/Tipo de destinatario/i),
      { target: { value: 'PRODUCT' } });
    fireEvent.change(screen.getByLabelText(/Identificador del destinatario/i),
      { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: /Calcular destinatarios/i }));

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalledWith(
        '/api/v1/admin/notifications/audience-count/',
        expect.objectContaining({
          params: expect.objectContaining({
            recipient_type: 'PRODUCT',
            product_id:     '7',
          }),
        }),
      );
    });
    expect(await screen.findByText(/42 destinatarios/i)).toBeInTheDocument();
  });

  it('muestra error si el backend rechaza con DESTINATARIO_INVALIDO', async () => {
    apiService.post.mockRejectedValue({
      message: 'El destinatario no puede recibir notificaciones',
      code:    'DESTINATARIO_INVALIDO',
      status:  422,
    });
    render(wrap(<AdminNotificationComposePage />, makeStore()));

    fireEvent.change(screen.getByLabelText(/Identificador del destinatario/i),
      { target: { value: 'noemail@x' } });
    fireEvent.change(screen.getByLabelText(/Asunto/i),
      { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/Mensaje/i),
      { target: { value: 'Mensaje' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar notificaci[oó]n/i }));

    expect(
      await screen.findByText(/El destinatario no puede recibir notificaciones/i),
    ).toBeInTheDocument();
  });
});
