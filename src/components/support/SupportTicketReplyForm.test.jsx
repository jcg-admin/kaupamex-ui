/**
 * Tests — SupportTicketReplyForm
 * UC-SUPP-03: Responder a un ticket (comprador o admin)
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
import supportTicketsReducer from '@redux/slices/supportTicketsSlice';
import SupportTicketReplyForm from './SupportTicketReplyForm';

const makeStore = () =>
  configureStore({ reducer: { supportTickets: supportTicketsReducer } });

const wrap = (ui, store) => (
  <Provider store={store}>
    <MemoryRouter>{ui}</MemoryRouter>
  </Provider>
);

afterEach(() => jest.clearAllMocks());

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
    expect(apiService.post).not.toHaveBeenCalled();
  });

  it('envia la respuesta al backend con el body indicado', async () => {
    apiService.post.mockResolvedValue({
      data: { id: 99, body: 'Mi respuesta valida', author: 'buyer', sent_at: '2026-05-19T10:00:00Z' },
    });

    render(wrap(<SupportTicketReplyForm ticketId={5} />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Tu respuesta/i), {
      target: { value: 'Esta es una respuesta valida con suficiente largo' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enviar respuesta/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        expect.stringContaining('/support/tickets/5/replies/'),
        expect.objectContaining({
          body: 'Esta es una respuesta valida con suficiente largo',
          is_internal: false,
        }),
      );
    });
  });

  it('limpia el campo despues de enviar una respuesta', async () => {
    apiService.post.mockResolvedValue({
      data: { id: 99, body: 'ok', author: 'buyer', sent_at: '2026-05-19T10:00:00Z' },
    });

    render(wrap(<SupportTicketReplyForm ticketId={5} />, makeStore()));
    const textarea = screen.getByLabelText(/Tu respuesta/i);
    fireEvent.change(textarea, { target: { value: 'Respuesta lo bastante larga' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar respuesta/i }));

    await waitFor(() => expect(textarea.value).toBe(''));
  });

  it('admin puede marcar la respuesta como nota interna', async () => {
    apiService.post.mockResolvedValue({
      data: { id: 1, body: 'Nota interna del equipo', is_internal: true, author: 'admin' },
    });

    render(wrap(<SupportTicketReplyForm ticketId={5} isAdmin />, makeStore()));
    const checkbox = screen.getByLabelText(/Nota interna/i);
    fireEvent.click(checkbox);
    fireEvent.change(screen.getByLabelText(/Tu respuesta/i), {
      target: { value: 'Nota interna del equipo' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enviar respuesta/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        expect.stringContaining('/support/tickets/5/replies/'),
        expect.objectContaining({ is_internal: true }),
      );
    });
  });

  it('no muestra checkbox de nota interna cuando no es admin', () => {
    render(wrap(<SupportTicketReplyForm ticketId={5} />, makeStore()));
    expect(screen.queryByLabelText(/Nota interna/i)).not.toBeInTheDocument();
  });
});
