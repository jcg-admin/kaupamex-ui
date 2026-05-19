/**
 * Tests — AdminContactMessageDetailPage
 * UC-COM-03: detalle del mensaje + responder al remitente.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
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

afterEach(() => jest.clearAllMocks());

describe('AdminContactMessageDetailPage (UC-COM-03)', () => {
  it('muestra el contenido del mensaje cargado', async () => {
    apiService.get.mockResolvedValue({
      data: {
        id: 7,
        name: 'Ana',
        email: 'ana@example.com',
        subject: 'Consulta sobre el producto X',
        message: 'Hola, queria saber sobre el envio.',
        status: 'UNREAD',
        created_at: '2026-05-01T10:00:00Z',
      },
    });
    render(wrap());
    expect(await screen.findByText(/Consulta sobre el producto X/i)).toBeInTheDocument();
    expect(screen.getByText(/Hola, queria saber sobre el envio/i)).toBeInTheDocument();
    expect(screen.getByText(/ana@example.com/i)).toBeInTheDocument();
  });

  it('requiere texto antes de enviar la respuesta', async () => {
    apiService.get.mockResolvedValue({
      data: { id: 7, name: 'Ana', email: 'ana@x.com', subject: 'Hola', message: 'Texto', status: 'READ', created_at: '2026-05-01T10:00:00Z' },
    });
    render(wrap());
    await screen.findByText(/Hola/i);

    fireEvent.click(screen.getByRole('button', { name: /Enviar respuesta/i }));
    expect(apiService.post).not.toHaveBeenCalled();
    expect(screen.getByText(/La respuesta es obligatoria/i)).toBeInTheDocument();
  });

  it('al enviar, hace POST a /api/v1/admin/contact/messages/<id>/reply/', async () => {
    apiService.get.mockResolvedValue({
      data: { id: 7, name: 'Ana', email: 'ana@x.com', subject: 'Hola', message: 'Texto', status: 'READ', created_at: '2026-05-01T10:00:00Z' },
    });
    apiService.post.mockResolvedValue({ data: { id: 7, status: 'REPLIED' } });
    render(wrap());
    await screen.findByText(/Hola/i);

    fireEvent.change(screen.getByLabelText(/Respuesta para el remitente/i),
      { target: { value: 'Gracias por escribirnos, el envio tarda 3 dias.' } });
    fireEvent.change(screen.getByLabelText(/Nota interna/i),
      { target: { value: 'cliente recurrente' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar respuesta/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/admin/contact/messages/7/reply/',
        expect.objectContaining({
          reply_body:    'Gracias por escribirnos, el envio tarda 3 dias.',
          internal_note: 'cliente recurrente',
        }),
      );
    });
  });

  it('muestra mensaje de exito tras responder', async () => {
    apiService.get.mockResolvedValue({
      data: { id: 7, name: 'Ana', email: 'ana@x.com', subject: 'Hola', message: 'Texto', status: 'READ', created_at: '2026-05-01T10:00:00Z' },
    });
    apiService.post.mockResolvedValue({ data: { id: 7, status: 'REPLIED' } });
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
