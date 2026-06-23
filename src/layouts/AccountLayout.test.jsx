/**
 * Tests AccountLayout — sidebar de la cuenta del comprador.
 *
 * Verifica que el menu lateral incluya todas las secciones que el
 * comprador puede usar (UC-WIS, UC-RET, UC-SUPP, UC-NOT, UC-AUTH-08).
 */
import { render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import authReducer from '@redux/slices/authSlice';
import cartReducer from '@redux/slices/cartSlice';
import uiReducer from '@redux/slices/uiSlice';
import AccountLayout from './AccountLayout';

const BASE = process.env.API_URL || 'http://localhost:8000';

function buildStore() {
  return configureStore({
    reducer: { auth: authReducer, cart: cartReducer, ui: uiReducer },
    preloadedState: {
      auth: {
        user: { id: 1, first_name: 'A', last_name: 'B', email: 'a@b.com' },
        isAuthenticated: true,
        accessToken: 'x', refreshToken: 'y',
        status: 'idle', error: null,
      },
    },
  });
}

function renderLayout() {
  server.use(
    http.get(`${BASE}/api/v1/notifications/count/`, () =>
      HttpResponse.json({ count: 0 }),
    ),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <Provider store={buildStore()}>
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <AccountLayout />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

describe('AccountLayout — sidebar del comprador', () => {
  it.each([
    ['Resumen',             '/account'],
    ['Mis pedidos',         '/account/orders'],
    ['Mis favoritos',       '/account/wishlist'],
    ['Mis devoluciones',    '/account/returns'],
    ['Soporte',             '/support/tickets'],
    ['Notificaciones',      '/account/notifications/preferences'],
    ['Mi perfil',           '/account/profile'],
    ['Cambiar contrasena',  '/account/change-password'],
    ['Dar de baja',         '/account/deactivate'],
  ])('expone el link "%s" hacia %s', (label, href) => {
    renderLayout();
    const nav  = screen.getByRole('navigation', { name: /menu de cuenta/i });
    const link = within(nav).getByRole('link', { name: new RegExp(`^${label}$`, 'i') });
    expect(link).toHaveAttribute('href', href);
  });
});
