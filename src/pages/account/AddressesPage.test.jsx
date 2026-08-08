/**
 * Tests — AddressesPage (UC-AUTH-07)
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import authReducer from '../../redux/slices/authSlice';
import AddressesPage from './AddressesPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const ADDR_1 = {
  id: 1, alias: 'Casa', recipient_name: 'Demo Yoruba', street: 'Av. Reforma',
  neighborhood: 'Centro', city: 'CDMX', state: 'CDMX',
  zip_code: '06000', country: 'MX', phone: '5551234567',
  is_default: true,
};
const ADDR_2 = {
  ...ADDR_1, id: 2, alias: 'Trabajo', recipient_name: 'Otra Persona',
  street: 'Calle 5', is_default: false,
};

const makeStore = (addresses = []) =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: { id: 1, email: 'test@test.com', addresses },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      },
    },
  });

const renderPage = (addresses = []) => {
  server.use(
    http.get(`${BASE}/api/v2/auth/addresses/`, () =>
      HttpResponse.json({ results: addresses }),
    ),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <Provider store={makeStore(addresses)}>
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <AddressesPage />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
};

describe('AddressesPage (UC-AUTH-07)', () => {
  it('muestra titulo y lista de direcciones', async () => {
    renderPage([ADDR_1, ADDR_2]);
    expect(
      await screen.findByRole('heading', { name: /mis direcciones/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Demo Yoruba')).toBeInTheDocument();
    expect(screen.getByText('Otra Persona')).toBeInTheDocument();
  });

  it('marca la direccion predeterminada con badge', async () => {
    renderPage([ADDR_1, ADDR_2]);
    await screen.findByText('Demo Yoruba');
    // El badge "Predeterminada" existe solo en la primera direccion
    const matches = screen.getAllByText(/predeterminada/i);
    expect(matches.length).toBeGreaterThan(0);
    // Y la segunda direccion tiene boton para hacerla predeterminada
    expect(
      screen.getByRole('button', { name: /hacer predeterminada/i }),
    ).toBeInTheDocument();
  });

  it('muestra slots vacios cuando no hay direcciones', async () => {
    renderPage([]);
    // H-15: la casilla vacía se renombró de "slot libre" (anglicismo de
    // desarrollo) a "Casilla disponible" en español.
    const emptySlots = await screen.findAllByText(/casilla disponible/i);
    expect(emptySlots.length).toBeGreaterThan(0);
  });

  it('Happy Path: agregar nueva direccion llama POST con campos', async () => {
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v2/auth/addresses/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({ id: 99, ...ADDR_1 });
      }),
    );
    renderPage([]);
    // Click "Añadir dirección" button
    fireEvent.click(screen.getByRole('button', { name: /añadir dirección/i }));

    fireEvent.change(screen.getByLabelText(/alias/i),
      { target: { value: 'Casa' } });
    fireEvent.change(screen.getByLabelText(/nombre del destinatario/i),
      { target: { value: 'Demo Yoruba' } });
    fireEvent.change(screen.getByLabelText(/teléfono/i),
      { target: { value: '5551234567' } });
    fireEvent.change(screen.getByLabelText(/calle y número/i),
      { target: { value: 'Av. Reforma' } });
    fireEvent.change(screen.getByLabelText(/colonia/i),
      { target: { value: 'Centro' } });
    fireEvent.change(screen.getByLabelText(/c\.p\./i),
      { target: { value: '06000' } });
    fireEvent.change(screen.getByLabelText(/ciudad/i),
      { target: { value: 'CDMX' } });
    fireEvent.change(screen.getByLabelText(/estado/i),
      { target: { value: 'CDMX' } });

    fireEvent.click(screen.getByRole('button', { name: /guardar dirección/i }));

    await waitFor(() => expect(lastBody).toMatchObject({
      alias: 'Casa',
      recipient_name: 'Demo Yoruba',
      phone: '5551234567',
      street: 'Av. Reforma',
      neighborhood: 'Centro',
      zip_code: '06000',
      city: 'CDMX',
      state: 'CDMX',
      country: 'MX',
    }));
  });

  it('valida campos obligatorios al enviar formulario', async () => {
    let postCalled = false;
    server.use(
      http.post(`${BASE}/api/v2/auth/addresses/`, () => {
        postCalled = true;
        return HttpResponse.json({});
      }),
    );
    renderPage([]);
    fireEvent.click(screen.getByRole('button', { name: /añadir dirección/i }));
    fireEvent.click(screen.getByRole('button', { name: /guardar dirección/i }));
    // HTML5 validation prevents submission; post not called
    expect(postCalled).toBe(false);
  });

  it('Alt B: eliminar direccion llama DELETE', async () => {
    let deleteCalled = false;
    server.use(
      http.delete(`${BASE}/api/v2/auth/addresses/2/`, () => {
        deleteCalled = true;
        return HttpResponse.json({});
      }),
    );
    // window.confirm must return true for delete to proceed
    window.confirm = jest.fn(() => true);
    renderPage([ADDR_2]);
    await screen.findByText('Otra Persona');
    fireEvent.click(
      screen.getByRole('button', { name: /eliminar/i }),
    );
    await waitFor(() => expect(deleteCalled).toBe(true));
  });

  it('Alt C: marcar predeterminada llama set-default', async () => {
    let lastUrl;
    server.use(
      http.post(`${BASE}/api/v2/auth/addresses/2/set-default/`, ({ request }) => {
        lastUrl = request.url;
        return HttpResponse.json({});
      }),
    );
    renderPage([ADDR_1, ADDR_2]);
    await screen.findByText('Otra Persona');
    fireEvent.click(
      screen.getByRole('button', { name: /hacer predeterminada/i }),
    );
    await waitFor(() => expect(lastUrl).toContain('/api/v2/auth/addresses/2/set-default/'));
  });
});

// T-214 (party migration): autocompletado de C.P. en el formulario de nueva
// dirección (useCpAutocomplete). Progressive enhancement: la captura manual
// nunca se bloquea, ni con 404 ni con error.
describe('AddressesPage — autocompletado de C.P. (T-214)', () => {
  const LOOKUP_BODY = {
    postal_code: '01000', country: 'MX', state: 'Ciudad de México',
    municipality: 'Álvaro Obregón', city: 'Ciudad de México',
    settlements: [
      { settlement_name: 'Los Alpes', settlement_type: 'Colonia' },
      { settlement_name: 'San José Insurgentes', settlement_type: 'Colonia' },
    ],
  };

  it('rellena ciudad/estado y ofrece colonias tras un C.P. valido', async () => {
    server.use(
      http.get(`${BASE}/api/v2/geo/postal-codes/:cp/`, () =>
        HttpResponse.json(LOOKUP_BODY),
      ),
    );
    renderPage([]);
    fireEvent.click(screen.getByRole('button', { name: /añadir dirección/i }));
    fireEvent.change(screen.getByLabelText(/c\.p\./i), { target: { value: '01000' } });

    await waitFor(
      () => expect(screen.getByLabelText(/ciudad/i).value).toBe('Ciudad de México'),
      { timeout: 3000 },
    );
    expect(screen.getByLabelText(/estado/i).value).toBe('Ciudad de México');

    const coloniaSelect = screen.getByLabelText(/colonia/i);
    expect(coloniaSelect.tagName).toBe('SELECT');
    fireEvent.change(coloniaSelect, { target: { value: 'Los Alpes' } });
    expect(coloniaSelect.value).toBe('Los Alpes');
  });

  it('un C.P. no encontrado (404) deja los campos en captura manual', async () => {
    let handled = false;
    server.use(
      http.get(`${BASE}/api/v2/geo/postal-codes/:cp/`, () => {
        handled = true;
        return HttpResponse.json({ codigo_error: 'POSTAL_CODE_NOT_FOUND' }, { status: 404 }); // canon-idioma: codigo_error real del api (contrato externo)
      }),
    );
    renderPage([]);
    fireEvent.click(screen.getByRole('button', { name: /añadir dirección/i }));
    fireEvent.change(screen.getByLabelText(/c\.p\./i), { target: { value: '99999' } });

    await waitFor(() => expect(handled).toBe(true), { timeout: 3000 });
    await waitFor(() => expect(screen.getByLabelText(/colonia/i).tagName).toBe('INPUT'));
    expect(screen.getByLabelText(/ciudad/i).value).toBe('');
  });

  it('con menos de 5 digitos no dispara el lookup', async () => {
    let requestMade = false;
    server.use(
      http.get(`${BASE}/api/v2/geo/postal-codes/:cp/`, () => {
        requestMade = true;
        return HttpResponse.json(LOOKUP_BODY);
      }),
    );
    renderPage([]);
    fireEvent.click(screen.getByRole('button', { name: /añadir dirección/i }));
    fireEvent.change(screen.getByLabelText(/c\.p\./i), { target: { value: '0100' } });

    await new Promise((r) => { setTimeout(r, 500); });
    expect(requestMade).toBe(false);
    expect(screen.getByLabelText(/colonia/i).tagName).toBe('INPUT');
  });
});
