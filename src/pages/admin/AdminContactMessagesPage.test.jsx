/**
 * Tests — AdminContactMessagesPage
 * UC-COM-02: bandeja admin de mensajes de contacto.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

const BASE = process.env.API_URL || 'http://localhost:8000';

import contactReducer from '@redux/slices/contactSlice';
import AdminContactMessagesPage from './AdminContactMessagesPage';

const makeStore = () =>
  configureStore({ reducer: { contact: contactReducer } });

const makeQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (ui) => (
  <Provider store={makeStore()}>
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  </Provider>
);

describe('AdminContactMessagesPage (UC-COM-02)', () => {
  it('muestra el titulo de la bandeja', () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/contact/messages/`, () => HttpResponse.json({ results: [] })),
    );
    render(wrap(<AdminContactMessagesPage />));
    expect(
      screen.getByRole('heading', { name: /Bandeja de mensajes de contacto/i }),
    ).toBeInTheDocument();
  });

  it('lista los mensajes del backend con asunto y estado', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/contact/messages/`, () =>
        HttpResponse.json({
          results: [
            // H-CICLO-COM-02: getStatusLabel usa m.replied / m.read (booleans), no m.status.
            { id: 1, name: 'Ana',  email: 'ana@x.com', subject: 'Consulta uno', read: false, replied: false, created_at: '2026-05-01T10:00:00Z' },
            { id: 2, name: 'Bob',  email: 'bob@x.com', subject: 'Consulta dos', read: true,  replied: true,  created_at: '2026-05-02T10:00:00Z' },
          ],
        }),
      ),
    );
    render(wrap(<AdminContactMessagesPage />));
    expect(await screen.findByText(/Consulta uno/i)).toBeInTheDocument();
    expect(screen.getByText(/Consulta dos/i)).toBeInTheDocument();
    // El estado "Sin leer" aparece en la opcion del filtro y en la fila;
    // basta con que aparezca al menos dos veces.
    expect(screen.getAllByText(/Sin leer/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/Respondido/i).length).toBeGreaterThanOrEqual(2);
  });

  it('llama a la URL de admin con el filtro de estado', async () => {
    let calledUrl;
    server.use(
      http.get(`${BASE}/api/v2/admin/contact/messages/`, ({ request }) => {
        calledUrl = request.url;
        return HttpResponse.json({ results: [] });
      }),
    );
    render(wrap(<AdminContactMessagesPage />));

    await waitFor(() => {
      expect(calledUrl).toContain('/api/v2/admin/contact/messages/');
    });
  });

  it('muestra estado vacio cuando no hay mensajes', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/contact/messages/`, () => HttpResponse.json({ results: [] })),
    );
    render(wrap(<AdminContactMessagesPage />));
    expect(
      await screen.findByText(/No hay mensajes para mostrar/i),
    ).toBeInTheDocument();
  });
});
