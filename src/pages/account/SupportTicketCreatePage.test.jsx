/**
 * Tests — SupportTicketCreatePage
 * UC-SUPP-01: Crear ticket de soporte
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
import SupportTicketCreatePage from './SupportTicketCreatePage';

const makeStore = () =>
  configureStore({ reducer: { supportTickets: supportTicketsReducer } });

const wrap = (ui, store) => (
  <Provider store={store}>
    <MemoryRouter>{ui}</MemoryRouter>
  </Provider>
);

afterEach(() => jest.clearAllMocks());

describe('SupportTicketCreatePage (UC-SUPP-01)', () => {
  it('muestra el titulo de la pagina', () => {
    render(wrap(<SupportTicketCreatePage />, makeStore()));
    expect(
      screen.getByRole('heading', { name: /Abrir ticket de soporte/i })
    ).toBeInTheDocument();
  });

  it('renderiza los campos obligatorios del formulario', () => {
    render(wrap(<SupportTicketCreatePage />, makeStore()));
    expect(screen.getByLabelText(/Asunto/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Descripción/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Categoría/i)).toBeInTheDocument();
  });

  it('muestra error si el asunto tiene menos de 5 caracteres', () => {
    render(wrap(<SupportTicketCreatePage />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Asunto/i),      { target: { value: 'abc' } });
    fireEvent.change(screen.getByLabelText(/Descripción/i), { target: { value: 'una descripcion suficiente' } });
    fireEvent.click(screen.getByRole('button', { name: /Crear ticket/i }));
    expect(screen.getByText(/El asunto debe tener al menos 5 caracteres/i)).toBeInTheDocument();
    expect(apiService.post).not.toHaveBeenCalled();
  });

  it('muestra error si la descripcion tiene menos de 10 caracteres', () => {
    render(wrap(<SupportTicketCreatePage />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Asunto/i),      { target: { value: 'Problema con mi pedido' } });
    fireEvent.change(screen.getByLabelText(/Descripción/i), { target: { value: 'corto' } });
    fireEvent.click(screen.getByRole('button', { name: /Crear ticket/i }));
    expect(screen.getByText(/La descripción debe tener al menos 10 caracteres/i)).toBeInTheDocument();
    expect(apiService.post).not.toHaveBeenCalled();
  });

  it('envia el ticket al backend cuando el formulario es valido', async () => {
    apiService.post.mockResolvedValue({
      data: { id: 42, subject: 'Problema con mi pedido', status: 'OPEN' },
    });

    render(wrap(<SupportTicketCreatePage />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Asunto/i),      { target: { value: 'Problema con mi pedido' } });
    fireEvent.change(screen.getByLabelText(/Descripción/i), { target: { value: 'El producto llego dañado' } });
    fireEvent.change(screen.getByLabelText(/Categoría/i),   { target: { value: 'ORDER' } });
    fireEvent.click(screen.getByRole('button', { name: /Crear ticket/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        expect.stringContaining('/support/tickets/'),
        expect.objectContaining({
          subject:  'Problema con mi pedido',
          body:     'El producto llego dañado',
          category: 'ORDER',
        }),
      );
    });
  });

  it('muestra confirmacion con el numero de ticket creado', async () => {
    apiService.post.mockResolvedValue({
      data: { id: 99, subject: 'Asunto', status: 'OPEN' },
    });

    render(wrap(<SupportTicketCreatePage />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Asunto/i),      { target: { value: 'Asunto valido' } });
    fireEvent.change(screen.getByLabelText(/Descripción/i), { target: { value: 'Descripcion suficiente para validar' } });
    fireEvent.click(screen.getByRole('button', { name: /Crear ticket/i }));

    expect(await screen.findByText(/Ticket #99/)).toBeInTheDocument();
  });
});
