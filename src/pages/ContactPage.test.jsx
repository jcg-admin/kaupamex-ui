/**
 * Tests — ContactPage
 * UC-COM-01: formulario publico de contacto.
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
import contactReducer from '@redux/slices/contactSlice';
import ContactPage from './ContactPage';

const makeStore = () =>
  configureStore({ reducer: { contact: contactReducer } });

const wrap = (ui, store) => (
  <Provider store={store}>
    <MemoryRouter>{ui}</MemoryRouter>
  </Provider>
);

afterEach(() => jest.clearAllMocks());

describe('ContactPage (UC-COM-01)', () => {
  it('muestra el titulo del formulario', () => {
    render(wrap(<ContactPage />, makeStore()));
    expect(
      screen.getByRole('heading', { name: /Contacto/i }),
    ).toBeInTheDocument();
  });

  it('exige nombre, email, asunto y mensaje antes de enviar', () => {
    render(wrap(<ContactPage />, makeStore()));
    fireEvent.click(screen.getByRole('button', { name: /Enviar mensaje/i }));
    expect(apiService.post).not.toHaveBeenCalled();
    expect(screen.getByText(/El nombre es obligatorio/i)).toBeInTheDocument();
    expect(screen.getByText(/El email es obligatorio/i)).toBeInTheDocument();
  });

  it('al enviar, hace POST a /api/v1/contact/messages/', async () => {
    apiService.post.mockResolvedValue({ data: { id: 1 } });
    render(wrap(<ContactPage />, makeStore()));

    fireEvent.change(screen.getByLabelText(/Nombre/i),
      { target: { value: 'Visitante Uno' } });
    fireEvent.change(screen.getByLabelText(/Email/i),
      { target: { value: 'visitante@example.com' } });
    fireEvent.change(screen.getByLabelText(/Asunto/i),
      { target: { value: 'Consulta de prueba' } });
    fireEvent.change(screen.getByLabelText(/Mensaje/i),
      { target: { value: 'Tengo una consulta sobre un producto del catalogo.' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar mensaje/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/contact/messages/',
        expect.objectContaining({
          name:    'Visitante Uno',
          email:   'visitante@example.com',
          subject: 'Consulta de prueba',
          message: 'Tengo una consulta sobre un producto del catalogo.',
        }),
      );
    });
  });

  it('muestra confirmacion tras el envio', async () => {
    apiService.post.mockResolvedValue({ data: { id: 99 } });
    render(wrap(<ContactPage />, makeStore()));

    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'ana@example.com' } });
    fireEvent.change(screen.getByLabelText(/Asunto/i), { target: { value: 'Hola' } });
    fireEvent.change(screen.getByLabelText(/Mensaje/i), { target: { value: 'Este es un mensaje de prueba largo.' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar mensaje/i }));

    expect(
      await screen.findByText(/Mensaje recibido/i),
    ).toBeInTheDocument();
  });

  it('muestra error si el backend rechaza', async () => {
    apiService.post.mockRejectedValue({
      message: 'Limite de mensajes alcanzado',
      code:    'LIMITE_ALCANZADO',
      status:  429,
    });
    render(wrap(<ContactPage />, makeStore()));

    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'ana@example.com' } });
    fireEvent.change(screen.getByLabelText(/Asunto/i), { target: { value: 'Hola' } });
    fireEvent.change(screen.getByLabelText(/Mensaje/i), { target: { value: 'Mensaje de prueba con suficiente longitud.' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar mensaje/i }));

    expect(
      await screen.findByText(/Limite de mensajes alcanzado/i),
    ).toBeInTheDocument();
  });
});
