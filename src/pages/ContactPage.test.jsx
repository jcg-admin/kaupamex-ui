/**
 * Tests — ContactPage
 * UC-COM-01: formulario publico de contacto.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import contactReducer from '@redux/slices/contactSlice';
import ContactPage from './ContactPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = () =>
  configureStore({ reducer: { contact: contactReducer } });

const wrap = (ui, store) => (
  <Provider store={store}>
    <MemoryRouter>{ui}</MemoryRouter>
  </Provider>
);

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
    expect(screen.getByText(/El nombre es obligatorio/i)).toBeInTheDocument();
    expect(screen.getByText(/El email es obligatorio/i)).toBeInTheDocument();
  });

  it('al enviar, hace POST a /api/v2/contact/messages/', async () => {
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v2/contact/messages/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({ id: 1 });
      }),
    );
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
      expect(lastBody).toMatchObject({
        name:    'Visitante Uno',
        email:   'visitante@example.com',
        subject: 'Consulta de prueba',
        // T-117 D-06: API canon expone `body` (no `message`).
        body:    'Tengo una consulta sobre un producto del catalogo.',
      });
    });
  });

  it('muestra confirmacion tras el envio', async () => {
    server.use(
      http.post(`${BASE}/api/v2/contact/messages/`, () =>
        HttpResponse.json({ id: 99 }),
      ),
    );
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
    // Usar 400 (no retryable) para que el error llegue inmediatamente.
    // BadRequestError usa data.detail como message (createErrorFromResponse).
    server.use(
      http.post(`${BASE}/api/v2/contact/messages/`, () =>
        HttpResponse.json(
          { detail: 'Limite de mensajes alcanzado', codigo_error: 'LIMIT_REACHED' },
          { status: 400 },
        ),
      ),
    );
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
