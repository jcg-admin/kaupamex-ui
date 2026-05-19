/**
 * Tests — AddressesPage (UC-AUTH-07)
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: {
    get: jest.fn(), post: jest.fn(),
    patch: jest.fn(), delete: jest.fn(),
  },
}));

import apiService from '@services/apiService';
import addressesReducer from '../../redux/slices/addressesSlice';
import AddressesPage from './AddressesPage';

const ADDR_1 = {
  id: 1, recipient: 'Demo Yoruba', street: 'Av. Reforma', exterior_number: '42',
  interior_number: '', neighborhood: 'Centro', city: 'CDMX', state: 'CDMX',
  postal_code: '06000', country: 'MX', phone: '5551234567',
  is_default: true,
};
const ADDR_2 = {
  ...ADDR_1, id: 2, recipient: 'Otra Persona',
  street: 'Calle 5', is_default: false,
};

const makeStore = () =>
  configureStore({ reducer: { addresses: addressesReducer } });

const renderPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <Provider store={makeStore()}>
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <AddressesPage />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
};

afterEach(() => jest.clearAllMocks());

describe('AddressesPage (UC-AUTH-07)', () => {
  it('muestra titulo y lista de direcciones', async () => {
    apiService.get.mockResolvedValue({ data: { results: [ADDR_1, ADDR_2] } });
    renderPage();
    expect(
      await screen.findByRole('heading', { name: /direcciones de envio/i }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Demo Yoruba')).toBeInTheDocument();
    expect(screen.getByText('Otra Persona')).toBeInTheDocument();
  });

  it('marca la direccion predeterminada con badge', async () => {
    apiService.get.mockResolvedValue({ data: { results: [ADDR_1, ADDR_2] } });
    renderPage();
    await screen.findByText('Demo Yoruba');
    // El badge "Predeterminada" no es boton; existe solo en la primera direccion
    const matches = screen.getAllByText(/predeterminada/i);
    expect(matches.length).toBeGreaterThan(0);
    // Y la segunda direccion tiene boton para hacerla predeterminada
    expect(
      screen.getByRole('button', { name: /hacer predeterminada otra persona/i }),
    ).toBeInTheDocument();
  });

  it('muestra estado vacio cuando no hay direcciones', async () => {
    apiService.get.mockResolvedValue({ data: { results: [] } });
    renderPage();
    expect(
      await screen.findByText(/no tienes direcciones guardadas/i),
    ).toBeInTheDocument();
  });

  it('Happy Path: agregar nueva direccion llama POST con campos', async () => {
    apiService.get.mockResolvedValue({ data: { results: [] } });
    apiService.post.mockResolvedValue({ data: { id: 99, ...ADDR_1 } });
    renderPage();
    await screen.findByText(/no tienes direcciones/i);
    fireEvent.click(screen.getByRole('button', { name: /agregar direccion/i }));

    fireEvent.change(screen.getByLabelText(/destinatario/i),
      { target: { value: 'Demo Yoruba', name: 'recipient' } });
    fireEvent.change(screen.getByLabelText(/^calle/i),
      { target: { value: 'Av. Reforma', name: 'street' } });
    fireEvent.change(screen.getByLabelText(/numero exterior/i),
      { target: { value: '42', name: 'exterior_number' } });
    fireEvent.change(screen.getByLabelText(/colonia/i),
      { target: { value: 'Centro', name: 'neighborhood' } });
    fireEvent.change(screen.getByLabelText(/^ciudad/i),
      { target: { value: 'CDMX', name: 'city' } });
    fireEvent.change(screen.getByLabelText(/^estado/i),
      { target: { value: 'CDMX', name: 'state' } });
    fireEvent.change(screen.getByLabelText(/codigo postal/i),
      { target: { value: '06000', name: 'postal_code' } });
    fireEvent.change(screen.getByLabelText(/telefono/i),
      { target: { value: '5551234567', name: 'phone' } });

    fireEvent.click(screen.getByRole('button', { name: /guardar direccion/i }));

    await waitFor(() => expect(apiService.post).toHaveBeenCalledWith(
      '/api/v1/auth/addresses/',
      expect.objectContaining({
        recipient: 'Demo Yoruba', street: 'Av. Reforma',
        exterior_number: '42', neighborhood: 'Centro',
        city: 'CDMX', state: 'CDMX', postal_code: '06000',
        phone: '5551234567', country: 'MX',
      }),
    ));
  });

  it('valida campos obligatorios al enviar formulario', async () => {
    apiService.get.mockResolvedValue({ data: { results: [] } });
    renderPage();
    await screen.findByText(/no tienes direcciones/i);
    fireEvent.click(screen.getByRole('button', { name: /agregar direccion/i }));
    fireEvent.click(screen.getByRole('button', { name: /guardar direccion/i }));
    await waitFor(() => {
      expect(screen.getByText(/destinatario.+obligatorio/i)).toBeInTheDocument();
    });
    expect(apiService.post).not.toHaveBeenCalled();
  });

  it('Alt B: eliminar direccion llama DELETE', async () => {
    apiService.get.mockResolvedValue({ data: { results: [ADDR_2] } });
    apiService.delete.mockResolvedValue({});
    renderPage();
    await screen.findByText('Otra Persona');
    fireEvent.click(
      screen.getByRole('button', { name: /eliminar direccion otra persona/i }),
    );
    await waitFor(() => expect(apiService.delete).toHaveBeenCalledWith(
      '/api/v1/auth/addresses/2/',
    ));
  });

  it('Alt C: marcar predeterminada llama set-default', async () => {
    apiService.get.mockResolvedValue({ data: { results: [ADDR_1, ADDR_2] } });
    apiService.post.mockResolvedValue({ data: {} });
    renderPage();
    await screen.findByText('Otra Persona');
    fireEvent.click(
      screen.getByRole('button', { name: /hacer predeterminada otra persona/i }),
    );
    await waitFor(() => expect(apiService.post).toHaveBeenCalledWith(
      '/api/v1/auth/addresses/2/set-default/',
      {},
    ));
  });
});
