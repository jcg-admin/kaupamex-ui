/**
 * Tests — AdminContactMessagesPage
 * UC-COM-02: bandeja admin de mensajes de contacto.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
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

afterEach(() => jest.clearAllMocks());

describe('AdminContactMessagesPage (UC-COM-02)', () => {
  it('muestra el titulo de la bandeja', () => {
    apiService.get.mockResolvedValue({ data: { results: [] } });
    render(wrap(<AdminContactMessagesPage />));
    expect(
      screen.getByRole('heading', { name: /Bandeja de mensajes de contacto/i }),
    ).toBeInTheDocument();
  });

  it('lista los mensajes del backend con asunto y estado', async () => {
    apiService.get.mockResolvedValue({
      data: {
        results: [
          { id: 1, name: 'Ana',  email: 'ana@x.com', subject: 'Consulta uno', status: 'UNREAD',    created_at: '2026-05-01T10:00:00Z' },
          { id: 2, name: 'Bob',  email: 'bob@x.com', subject: 'Consulta dos', status: 'REPLIED',   created_at: '2026-05-02T10:00:00Z' },
        ],
      },
    });
    render(wrap(<AdminContactMessagesPage />));
    expect(await screen.findByText(/Consulta uno/i)).toBeInTheDocument();
    expect(screen.getByText(/Consulta dos/i)).toBeInTheDocument();
    // El estado "Sin leer" aparece en la opcion del filtro y en la fila;
    // basta con que aparezca al menos dos veces.
    expect(screen.getAllByText(/Sin leer/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/Respondido/i).length).toBeGreaterThanOrEqual(2);
  });

  it('llama a la URL de admin con el filtro de estado', async () => {
    apiService.get.mockResolvedValue({ data: { results: [] } });
    render(wrap(<AdminContactMessagesPage />));

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalledWith(
        '/api/v1/admin/contact/messages/',
        expect.objectContaining({
          params: expect.any(Object),
        }),
      );
    });
  });

  it('muestra estado vacio cuando no hay mensajes', async () => {
    apiService.get.mockResolvedValue({ data: { results: [] } });
    render(wrap(<AdminContactMessagesPage />));
    expect(
      await screen.findByText(/No hay mensajes para mostrar/i),
    ).toBeInTheDocument();
  });
});
