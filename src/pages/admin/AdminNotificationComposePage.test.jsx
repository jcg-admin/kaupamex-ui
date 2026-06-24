/**
 * Tests — AdminNotificationComposePage
 * UC-NOT-07: Enviar notificacion manual a usuario (admin).
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import notificationsReducer from '@redux/slices/notificationsSlice';
import AdminNotificationComposePage from './AdminNotificationComposePage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = () =>
  configureStore({ reducer: { notifications: notificationsReducer } });

const wrap = (ui, store) => (
  <Provider store={store}>
    <MemoryRouter>{ui}</MemoryRouter>
  </Provider>
);

describe('AdminNotificationComposePage (UC-NOT-07)', () => {
  it('muestra el titulo del compositor', () => {
    render(wrap(<AdminNotificationComposePage />, makeStore()));
    expect(
      screen.getByRole('heading', { name: /Notificaci[oó]n manual/i }),
    ).toBeInTheDocument();
  });

  it('ofrece destinatario USER o PRODUCT_BUYERS (canon API)', () => {
    // T-116 D-02 (iter 17): backend ManualNotification.RecipientType
    // expone solo USER + PRODUCT_BUYERS. Test antes asertaba 3 opciones
    // inventadas {EMAIL, ORDER, PRODUCT} -> soft-on-tests.
    render(wrap(<AdminNotificationComposePage />, makeStore()));
    const select = screen.getByLabelText(/Tipo de destinatario/i);
    expect(select.querySelectorAll('option')).toHaveLength(2);
    expect(select).toHaveTextContent(/Usuario especifico/i);
    expect(select).toHaveTextContent(/Compradores de producto/i);
  });

  it('requiere asunto y mensaje antes de enviar', () => {
    let postCalled = false;
    server.use(
      http.post(`${BASE}/api/v1/admin/notifications/manual/`, () => {
        postCalled = true;
        return HttpResponse.json({});
      }),
    );
    render(wrap(<AdminNotificationComposePage />, makeStore()));
    fireEvent.click(screen.getByRole('button', { name: /Enviar notificaci[oó]n/i }));
    expect(postCalled).toBe(false);
    expect(screen.getByText(/El asunto es obligatorio/i)).toBeInTheDocument();
  });

  it('al enviar, hace POST con destinatario, asunto y mensaje', async () => {
    let lastPostBody;
    server.use(
      http.post(`${BASE}/api/v1/admin/notifications/manual/`, async ({ request }) => {
        lastPostBody = await request.json();
        return HttpResponse.json({ id: 99, recipients_count: 1, status: 'SENT' }, { status: 201 });
      }),
    );
    render(wrap(<AdminNotificationComposePage />, makeStore()));

    fireEvent.change(screen.getByLabelText(/Tipo de destinatario/i),
      { target: { value: 'USER' } });
    fireEvent.change(screen.getByLabelText(/Identificador del destinatario/i),
      { target: { value: 'cliente@example.com' } });
    fireEvent.change(screen.getByLabelText(/Asunto/i),
      { target: { value: 'Su pedido ha sido revisado' } });
    fireEvent.change(screen.getByLabelText(/Mensaje/i),
      { target: { value: 'Hola, le confirmamos que su caso ya fue atendido.' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar notificaci[oó]n/i }));

    await waitFor(() => {
      expect(lastPostBody).toMatchObject({
        recipient_type:       'USER',
        recipient_identifier: 'cliente@example.com',
        subject:              'Su pedido ha sido revisado',
        message:              'Hola, le confirmamos que su caso ya fue atendido.',
      });
    });
  });

  it('muestra mensaje de exito tras un envio correcto', async () => {
    server.use(
      http.post(`${BASE}/api/v1/admin/notifications/manual/`, async ({ request }) => {
        await request.json();
        return HttpResponse.json({ id: 99, recipients_count: 1, status: 'SENT' }, { status: 201 });
      }),
    );
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

  it('muestra el conteo de destinatarios cuando se elige PRODUCT_BUYERS', async () => {
    let capturedParams;
    server.use(
      http.get(`${BASE}/api/v2/admin/notifications/audience-count/`, ({ request }) => {
        const url = new URL(request.url);
        capturedParams = Object.fromEntries(url.searchParams.entries());
        return HttpResponse.json({ count: 42 });
      }),
    );
    render(wrap(<AdminNotificationComposePage />, makeStore()));

    fireEvent.change(screen.getByLabelText(/Tipo de destinatario/i),
      { target: { value: 'PRODUCT_BUYERS' } });
    fireEvent.change(screen.getByLabelText(/Identificador del destinatario/i),
      { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: /Calcular destinatarios/i }));

    await waitFor(() => {
      expect(capturedParams).toMatchObject({
        recipient_type: 'PRODUCT_BUYERS',
        product_id:     '7',
      });
    });
    expect(await screen.findByText(/42 destinatarios/i)).toBeInTheDocument();
  });

  it('muestra error si el backend rechaza con DESTINATARIO_INVALIDO', async () => {
    server.use(
      http.post(`${BASE}/api/v1/admin/notifications/manual/`, () =>
        HttpResponse.json(
          { message: 'El destinatario no puede recibir notificaciones', code: 'RECIPIENT_INVALID' },
          { status: 422 },
        ),
      ),
    );
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
