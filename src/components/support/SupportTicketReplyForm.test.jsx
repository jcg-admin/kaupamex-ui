/**
 * Tests — SupportTicketReplyForm
 * UC-SUPP-03: Responder a un ticket (comprador o admin)
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import supportTicketsReducer from '@redux/slices/supportTicketsSlice';
import SupportTicketReplyForm from './SupportTicketReplyForm';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = () =>
  configureStore({ reducer: { supportTickets: supportTicketsReducer } });

const wrap = (ui, store) => (
  <Provider store={store}>
    <MemoryRouter>{ui}</MemoryRouter>
  </Provider>
);

describe('SupportTicketReplyForm (UC-SUPP-03)', () => {
  it('renderiza el campo de texto y el boton de enviar', () => {
    render(wrap(<SupportTicketReplyForm ticketId={5} />, makeStore()));
    expect(screen.getByLabelText(/Tu respuesta/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Enviar respuesta/i })
    ).toBeInTheDocument();
  });

  it('muestra error si el cuerpo tiene menos de 10 caracteres', () => {
    render(wrap(<SupportTicketReplyForm ticketId={5} />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Tu respuesta/i), { target: { value: 'corto' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar respuesta/i }));
    expect(
      screen.getByText(/La respuesta debe tener al menos 10 caracteres/i)
    ).toBeInTheDocument();
  });

  it('envia la respuesta al backend con el body indicado', async () => {
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v1/support/tickets/5/replies/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({ id: 99, body: 'Mi respuesta valida', author: 'buyer', sent_at: '2026-05-19T10:00:00Z' });
      }),
    );

    render(wrap(<SupportTicketReplyForm ticketId={5} />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Tu respuesta/i), {
      target: { value: 'Esta es una respuesta valida con suficiente largo' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enviar respuesta/i }));

    await waitFor(() => {
      expect(lastBody).toMatchObject({
        body: 'Esta es una respuesta valida con suficiente largo',
        is_internal_note: false,
      });
    });
  });

  it('limpia el campo despues de enviar una respuesta', async () => {
    server.use(
      http.post(`${BASE}/api/v1/support/tickets/5/replies/`, () =>
        HttpResponse.json({ id: 99, body: 'ok', author: 'buyer', sent_at: '2026-05-19T10:00:00Z' }),
      ),
    );

    render(wrap(<SupportTicketReplyForm ticketId={5} />, makeStore()));
    const textarea = screen.getByLabelText(/Tu respuesta/i);
    fireEvent.change(textarea, { target: { value: 'Respuesta lo bastante larga' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar respuesta/i }));

    await waitFor(() => expect(textarea.value).toBe(''));
  });

  it('admin puede marcar la respuesta como nota interna', async () => {
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v1/support/tickets/5/replies/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({ id: 1, body: 'Nota interna del equipo', is_internal: true, author: 'admin' });
      }),
    );

    render(wrap(<SupportTicketReplyForm ticketId={5} isAdmin />, makeStore()));
    const checkbox = screen.getByLabelText(/Nota interna/i);
    fireEvent.click(checkbox);
    fireEvent.change(screen.getByLabelText(/Tu respuesta/i), {
      target: { value: 'Nota interna del equipo' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enviar respuesta/i }));

    await waitFor(() => {
      expect(lastBody).toMatchObject({ is_internal_note: true });
    });
  });

  it('no muestra checkbox de nota interna cuando no es admin', () => {
    render(wrap(<SupportTicketReplyForm ticketId={5} />, makeStore()));
    expect(screen.queryByLabelText(/Nota interna/i)).not.toBeInTheDocument();
  });
});
