/**
 * Tests — SupportTicketActions
 * UC-SUPP-04: Cerrar / Reabrir ticket
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
import SupportTicketActions from './SupportTicketActions';

const makeStore = () =>
  configureStore({ reducer: { supportTickets: supportTicketsReducer } });

const wrap = (ui, store) => (
  <Provider store={store}>
    <MemoryRouter>{ui}</MemoryRouter>
  </Provider>
);

afterEach(() => jest.clearAllMocks());

describe('SupportTicketActions (UC-SUPP-04)', () => {
  it('muestra boton de cerrar cuando el ticket esta OPEN', () => {
    render(wrap(
      <SupportTicketActions ticket={{ id: 7, status: 'OPEN' }} />,
      makeStore(),
    ));
    expect(
      screen.getByRole('button', { name: /Cerrar ticket/i })
    ).toBeInTheDocument();
  });

  it('muestra boton de cerrar cuando el ticket esta REPLIED', () => {
    render(wrap(
      <SupportTicketActions ticket={{ id: 7, status: 'REPLIED' }} />,
      makeStore(),
    ));
    expect(
      screen.getByRole('button', { name: /Cerrar ticket/i })
    ).toBeInTheDocument();
  });

  it('muestra boton de reabrir cuando el ticket esta CLOSED', () => {
    render(wrap(
      <SupportTicketActions ticket={{ id: 7, status: 'CLOSED' }} />,
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
    apiService.post.mockResolvedValue({
      data: { id: 7, status: 'CLOSED' },
    });
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(wrap(
      <SupportTicketActions ticket={{ id: 7, status: 'OPEN' }} />,
      makeStore(),
    ));
    fireEvent.click(screen.getByRole('button', { name: /Cerrar ticket/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        expect.stringContaining('/support/tickets/7/close/'),
        expect.any(Object),
      );
    });

    confirmSpy.mockRestore();
  });

  it('no cierra si el usuario cancela la confirmacion', () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

    render(wrap(
      <SupportTicketActions ticket={{ id: 7, status: 'OPEN' }} />,
      makeStore(),
    ));
    fireEvent.click(screen.getByRole('button', { name: /Cerrar ticket/i }));

    expect(apiService.post).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('llama al endpoint de reabrir al confirmar', async () => {
    apiService.post.mockResolvedValue({
      data: { id: 7, status: 'OPEN' },
    });
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(wrap(
      <SupportTicketActions ticket={{ id: 7, status: 'CLOSED' }} />,
      makeStore(),
    ));
    fireEvent.click(screen.getByRole('button', { name: /Reabrir ticket/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        expect.stringContaining('/support/tickets/7/reopen/'),
      );
    });

    confirmSpy.mockRestore();
  });
});
