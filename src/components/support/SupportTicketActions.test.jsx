/**
 * Tests — SupportTicketActions
 * UC-SUPP-04: Cerrar / Reabrir ticket
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import supportTicketsReducer from '@redux/slices/supportTicketsSlice';
import SupportTicketActions from './SupportTicketActions';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = () =>
  configureStore({ reducer: { supportTickets: supportTicketsReducer } });

const wrap = (ui, store) => (
  <Provider store={store}>
    <MemoryRouter>{ui}</MemoryRouter>
  </Provider>
);

describe('SupportTicketActions (UC-SUPP-04)', () => {
  it('muestra boton de cerrar cuando el ticket esta OPEN', () => {
    render(wrap(
      <SupportTicketActions ticket={{ ticket_id: 7, status: 'OPEN' }} />,
      makeStore(),
    ));
    expect(
      screen.getByRole('button', { name: /Cerrar ticket/i })
    ).toBeInTheDocument();
  });

  it('muestra boton de cerrar cuando el ticket esta IN_PROGRESS', () => {
    render(wrap(
      <SupportTicketActions ticket={{ ticket_id: 7, status: 'IN_PROGRESS' }} />,
      makeStore(),
    ));
    expect(
      screen.getByRole('button', { name: /Cerrar ticket/i })
    ).toBeInTheDocument();
  });

  it('muestra boton de reabrir cuando el ticket esta CLOSED', () => {
    render(wrap(
      <SupportTicketActions ticket={{ ticket_id: 7, status: 'CLOSED' }} />,
      makeStore(),
    ));
    expect(
      screen.getByRole('button', { name: /Reabrir ticket/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Cerrar ticket/i })
    ).not.toBeInTheDocument();
  });

  it('llama al endpoint de cerrar al confirmar', async () => {
    let called = false;
    let lastBody;
    server.use(
      http.patch(`${BASE}/api/v2/support/tickets/7/status/`, async ({ request }) => {
        called = true;
        lastBody = await request.json();
        return HttpResponse.json({ id: 7, status: 'CLOSED' });
      }),
    );
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(wrap(
      <SupportTicketActions ticket={{ ticket_id: 7, status: 'OPEN' }} />,
      makeStore(),
    ));
    fireEvent.click(screen.getByRole('button', { name: /Cerrar ticket/i }));

    await waitFor(() => expect(called).toBe(true));
    expect(lastBody).toMatchObject({ action: 'close' });

    confirmSpy.mockRestore();
  });

  it('no cierra si el usuario cancela la confirmacion', () => {
    let called = false;
    server.use(
      http.patch(`${BASE}/api/v2/support/tickets/7/status/`, () => {
        called = true;
        return HttpResponse.json({});
      }),
    );
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

    render(wrap(
      <SupportTicketActions ticket={{ ticket_id: 7, status: 'OPEN' }} />,
      makeStore(),
    ));
    fireEvent.click(screen.getByRole('button', { name: /Cerrar ticket/i }));

    expect(called).toBe(false);
    confirmSpy.mockRestore();
  });

  it('llama al endpoint de reabrir al confirmar', async () => {
    let lastBody;
    server.use(
      http.patch(`${BASE}/api/v2/support/tickets/7/status/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({ id: 7, status: 'OPEN' });
      }),
    );
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(wrap(
      <SupportTicketActions ticket={{ ticket_id: 7, status: 'CLOSED' }} />,
      makeStore(),
    ));
    fireEvent.click(screen.getByRole('button', { name: /Reabrir ticket/i }));

    await waitFor(() => {
      expect(lastBody).toMatchObject({ action: 'reopen' });
    });

    confirmSpy.mockRestore();
  });
});
