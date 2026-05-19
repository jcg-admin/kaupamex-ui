/**
 * Tests Header — badge de notificaciones cableado a
 * useUnreadNotificationsCount (cierre D-012).
 */
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

import apiService from '@services/apiService';

// Slices necesarios para selectores
import authReducer from '@redux/slices/authSlice';
import cartReducer from '@redux/slices/cartSlice';
import uiReducer from '@redux/slices/uiSlice';

import Header from './index';

function buildStore({ isAuthenticated = false } = {}) {
  return configureStore({
    reducer: {
      auth: authReducer,
      cart: cartReducer,
      ui:   uiReducer,
    },
    preloadedState: {
      auth: {
        user: isAuthenticated ? { id: 1, username: 'pepe' } : null,
        isAuthenticated,
        accessToken:  isAuthenticated ? 'token' : null,
        refreshToken: isAuthenticated ? 'rtoken' : null,
        status: 'idle',
        error:  null,
      },
    },
  });
}

function renderHeader({ isAuthenticated = false } = {}) {
  const store  = buildStore({ isAuthenticated });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

afterEach(() => jest.clearAllMocks());

describe('Header — badge de notificaciones (D-012)', () => {
  it('no renderiza el boton de notificaciones para visitantes anonimos', () => {
    renderHeader({ isAuthenticated: false });
    expect(screen.queryByLabelText(/notificaciones/i)).toBeNull();
    // El hook no debe golpear la API si no hay sesion.
    expect(apiService.get).not.toHaveBeenCalledWith(
      '/api/v1/notifications/unread-count/',
      expect.anything(),
    );
  });

  it('autenticado: renderiza el boton de notificaciones (sin badge si count=0)', async () => {
    apiService.get.mockResolvedValue({ data: { count: 0 } });
    renderHeader({ isAuthenticated: true });
    const link = await screen.findByLabelText(/notificaciones/i);
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toBe('/account/notifications/preferences');
  });

  it('autenticado: muestra el numero de notificaciones sin leer en el badge', async () => {
    apiService.get.mockResolvedValue({ data: { count: 5 } });
    renderHeader({ isAuthenticated: true });
    expect(await screen.findByText('5')).toBeInTheDocument();
  });

  it('trunca a 99+ cuando el conteo supera 99', async () => {
    apiService.get.mockResolvedValue({ data: { count: 250 } });
    renderHeader({ isAuthenticated: true });
    expect(await screen.findByText('99+')).toBeInTheDocument();
  });
});
