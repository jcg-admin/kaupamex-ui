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
import { CookieConsentProvider } from '@context/CookieConsentContext';

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

function renderLayout({ unread = 0 } = {}) {
  server.use(
    http.get(`${BASE}/api/v2/notifications/unread-count/`, () =>
      HttpResponse.json({ count: unread }),
    ),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <Provider store={buildStore()}>
      <QueryClientProvider client={client}>
        <CookieConsentProvider>
          <MemoryRouter>
            <AccountLayout />
          </MemoryRouter>
        </CookieConsentProvider>
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
    ['Notificaciones',      '/account/notifications'],
    ['Mi perfil',           '/account/profile'],
    ['Cambiar contrasena',  '/account/change-password'],
    ['Dar de baja',         '/account/deactivate'],
  ])('expone el link "%s" hacia %s', (label, href) => {
    renderLayout();
    const nav  = screen.getByRole('navigation', { name: /menu de cuenta/i });
    const link = within(nav).getByRole('link', { name: new RegExp(`^${label}$`, 'i') });
    expect(link).toHaveAttribute('href', href);
  });

  it('muestra el badge de no leídas en el ítem Notificaciones cuando hay >0', async () => {
    renderLayout({ unread: 5 });
    expect(await screen.findByText('5')).toBeInTheDocument();
    expect(screen.getByText('5')).toHaveAttribute('data-position', 'corner');
    // El badge lleva aria-label descriptivo para lectores de pantalla.
    expect(screen.getByLabelText(/5 sin leer/i)).toBeInTheDocument();
  });

  it('no muestra badge cuando no hay no leídas (count 0)', () => {
    renderLayout({ unread: 0 });
    const nav = screen.getByRole('navigation', { name: /menu de cuenta/i });
    // Sin badge, el nombre accesible del link es la etiqueta pura (el badge
    // llevaría aria-label "N sin leer" que ensuciaría el nombre del link).
    const link = within(nav).getByRole('link', { name: /^Notificaciones$/i });
    expect(link).toBeInTheDocument();
    expect(within(nav).queryByLabelText(/sin leer/i)).not.toBeInTheDocument();
  });

  it('usa el menú dinámico registro-dirigido cuando el backend lo provee', async () => {
    // El backend devuelve la sección 'Mi cuenta' con un ítem que NO existe en
    // el fallback estático: si aparece, es que el menú lo dirige el registro
    // (seed_menu), no la lista fija del UI (DEC-AUTHZ-BUYER).
    server.use(
      http.get(`${BASE}/api/v2/authz/me/menu/`, () =>
        HttpResponse.json([
          { label: 'Mi cuenta', route: '', children: [
            { label: 'Mis pedidos', route: '/account/orders', children: [] },
            { label: 'Suscripciones', route: '/account/subscriptions', children: [] },
          ] },
        ]),
      ),
    );
    renderLayout();
    const nav = screen.getByRole('navigation', { name: /menu de cuenta/i });
    const link = await within(nav).findByRole('link', { name: /^Suscripciones$/i });
    expect(link).toHaveAttribute('href', '/account/subscriptions');
  });
});
