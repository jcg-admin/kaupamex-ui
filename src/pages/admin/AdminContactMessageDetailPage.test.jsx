/**
 * Tests — AdminContactMessageDetailPage
 * UC-COM-03: detalle del mensaje + responder al remitente.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

const BASE = process.env.API_URL || 'http://localhost:8000';

import contactReducer from '@redux/slices/contactSlice';
import AdminContactMessageDetailPage from './AdminContactMessageDetailPage';

const makeStore = () =>
  configureStore({ reducer: { contact: contactReducer } });

const makeQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (initialPath = '/admin/contact/messages/7') => (
  <Provider store={makeStore()}>
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            path="/admin/contact/messages/:id"
            element={<AdminContactMessageDetailPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  </Provider>
);

describe('AdminContactMessageDetailPage (UC-COM-03)', () => {
  it('muestra el contenido del mensaje cargado', async () => {
    // H-CICLO-COM-01: el campo es "body" no "message" en el serializer.
    server.use(
      http.get(`${BASE}/api/v1/admin/contact/messages/7/`, () =>
        HttpResponse.json({
          id: 7,
          name: 'Ana',
          email: 'ana@example.com',
          subject: 'Consulta sobre el producto X',
          body: 'Hola, queria saber sobre el envio.',
          read: false, replied: false,
          created_at: '2026-05-01T10:00:00Z',
        }),
      ),
    );
    server.use(
      http.post(`${BASE}/api/v1/admin/contact/messages/7/read/`, () => HttpResponse.json({})),
    );
    render(wrap());
    expect(await screen.findByText(/Consulta sobre el producto X/i)).toBeInTheDocument();
    expect(screen.getByText(/Hola, queria saber sobre el envio/i)).toBeInTheDocument();
    expect(screen.getByText(/ana@example.com/i)).toBeInTheDocument();
  });

  it('requiere texto antes de enviar la respuesta', async () => {
    // read: true evita que useEffect dispare markContactMessageRead (que
    // pondria isActioning=true y deshabilitaria el boton de envio).
    server.use(
      http.get(`${BASE}/api/v1/admin/contact/messages/7/`, () =>
        HttpResponse.json({
          id: 7, name: 'Ana', email: 'ana@x.com', subject: 'Hola', body: 'Texto', read: true, replied: false, created_at: '2026-05-01T10:00:00Z',
        }),
      ),
    );
    let replyCalled = false;
    server.use(
      http.post(`${BASE}/api/v1/admin/contact/messages/7/reply/`, () => {
        replyCalled = true;
        return HttpResponse.json({});
      }),
    );
    render(wrap());
    await screen.findByText(/Hola/i);

    fireEvent.click(screen.getByRole('button', { name: /Enviar respuesta/i }));
    expect(replyCalled).toBe(false);
    expect(screen.getByText(/La respuesta es obligatoria/i)).toBeInTheDocument();
  });

  it('al enviar, hace POST a /api/v1/admin/contact/messages/<id>/reply/', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/contact/messages/7/`, () =>
        HttpResponse.json({
          id: 7, name: 'Ana', email: 'ana@x.com', subject: 'Hola', body: 'Texto', read: true, replied: false, created_at: '2026-05-01T10:00:00Z',
        }),
      ),
    );
    let lastReplyBody;
    server.use(
      http.post(`${BASE}/api/v1/admin/contact/messages/:id/reply/`, async ({ request }) => {
        lastReplyBody = await request.json();
        return HttpResponse.json({ id: 7, status: 'REPLIED' });
      }),
    );
    render(wrap());
    await screen.findByText(/Hola/i);

    fireEvent.change(screen.getByLabelText(/Respuesta para el remitente/i),
      { target: { value: 'Gracias por escribirnos, el envio tarda 3 dias.' } });
    fireEvent.change(screen.getByLabelText(/Nota interna/i),
      { target: { value: 'cliente recurrente' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar respuesta/i }));

    await waitFor(() => {
      expect(lastReplyBody).toMatchObject({
        reply_body:    'Gracias por escribirnos, el envio tarda 3 dias.',
        internal_note: 'cliente recurrente',
      });
    });
  });

  it('muestra mensaje de exito tras responder', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/contact/messages/7/`, () =>
        HttpResponse.json({
          id: 7, name: 'Ana', email: 'ana@x.com', subject: 'Hola', body: 'Texto', read: true, replied: false, created_at: '2026-05-01T10:00:00Z',
        }),
      ),
    );
    server.use(
      http.post(`${BASE}/api/v1/admin/contact/messages/:id/reply/`, () =>
        HttpResponse.json({ id: 7, status: 'REPLIED' }),
      ),
    );
    render(wrap());
    await screen.findByText(/Hola/i);

    fireEvent.change(screen.getByLabelText(/Respuesta para el remitente/i),
      { target: { value: 'Una respuesta razonable.' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar respuesta/i }));

    expect(
      await screen.findByText(/Respuesta enviada/i),
    ).toBeInTheDocument();
  });
});
