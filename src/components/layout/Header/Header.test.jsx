/**
 * Tests Header — navigation and auth state behavior.
 *
 * The Header component renders:
 *   - Brand logo/link
 *   - Category navigation links
 *   - Search trigger button
 *   - Auth-dependent actions: "Ingresar" (anon) or "Mi cuenta" link (authed)
 *   - Cart link with item count badge
 *   - Wishlist link
 *
 * The Header does NOT render a notifications bell/button.
 * Notifications UI is handled elsewhere in the app.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Slices necesarios para selectores
import authReducer from '@redux/slices/authSlice';
import cartReducer from '@redux/slices/cartSlice';
import uiReducer from '@redux/slices/uiSlice';
import catalogReducer from '@redux/slices/catalogSlice';

import Header from './index';

function buildStore({ isAuthenticated = false, cartCount = 0, isAdmin = false } = {}) {
  return configureStore({
    reducer: {
      auth: authReducer,
      cart: cartReducer,
      ui:   uiReducer,
      catalog: catalogReducer,
    },
    preloadedState: {
      catalog: {
        categories: [
          { slug: 'collares-de-orumila', name: 'Collares de Orumila' },
          { slug: 'ropa-y-telas',        name: 'Ropa y Telas' },
        ],
      },
      auth: {
        user: isAuthenticated ? { id: 1, username: 'pepe', is_staff: isAdmin } : null,
        isAuthenticated,
        accessToken:  isAuthenticated ? 'token' : null,
        refreshToken: isAuthenticated ? 'rtoken' : null,
        status: 'idle',
        error:  null,
      },
      cart: {
        items: [],
        voucher: null,
        totals: { subtotal: 0, discount: 0, tax: 0, total: 0 },
        itemCount: cartCount,
        isLoading: false,
        error: null,
        isActioning: false,
        actionError: null,
        lastAction: null,
      },
    },
  });
}

function renderHeader({ isAuthenticated = false, cartCount = 0, isAdmin = false } = {}) {
  const store  = buildStore({ isAuthenticated, cartCount, isAdmin });
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

describe('Header — navegación y estado de autenticación', () => {
  it('renderiza el logo con enlace a inicio', () => {
    renderHeader();
    const homeLink = screen.getByRole('link', { name: /Inicio/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('muestra el boton "Ingresar" para visitantes anonimos', () => {
    renderHeader({ isAuthenticated: false });
    expect(screen.getByRole('button', { name: /Ingresar/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Mi cuenta/i })).toBeNull();
  });

  it('muestra el menú "Mi cuenta" para usuarios autenticados', () => {
    renderHeader({ isAuthenticated: true });
    expect(screen.getByText(/Mi cuenta/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Ingresar/i })).toBeNull();
  });

  it('muestra la navegacion con las categorias reales de la API', () => {
    renderHeader();
    expect(screen.getByRole('link', { name: /Collares de Orumila/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ropa y Telas/i })).toBeInTheDocument();
    // El link debe apuntar al slug real, no a uno hardcodeado inexistente.
    expect(screen.getByRole('link', { name: /Collares de Orumila/i }))
      .toHaveAttribute('href', '/catalog?cat=collares-de-orumila');
  });

  it('muestra el boton de carrito con el conteo de piezas', () => {
    renderHeader({ cartCount: 3 });
    const cartBtn = screen.getByRole('link', { name: /Carrito \(3/i });
    expect(cartBtn).toBeInTheDocument();
  });

  it('permite "Cerrar sesión" desde el menú de cuenta', () => {
    renderHeader({ isAuthenticated: true });
    // El logout ahora vive dentro del dropdown "Mi cuenta": abrir y verificar.
    fireEvent.click(screen.getByText(/Mi cuenta/i));
    expect(screen.getByRole('menuitem', { name: /Cerrar sesión/i })).toBeInTheDocument();
  });

  it('no muestra "Cerrar sesión" para visitantes anónimos', () => {
    renderHeader({ isAuthenticated: false });
    expect(screen.queryByText(/Cerrar sesión/i)).toBeNull();
  });

  it('muestra "Panel admin" solo si el usuario es staff (UC-ADM-08)', () => {
    renderHeader({ isAuthenticated: true, isAdmin: true });
    const adminLink = screen.getByRole('link', { name: /Panel admin/i });
    expect(adminLink).toHaveAttribute('href', '/admin');
  });

  it('oculta "Panel admin" para usuarios no-staff', () => {
    renderHeader({ isAuthenticated: true, isAdmin: false });
    expect(screen.queryByRole('link', { name: /Panel admin/i })).toBeNull();
  });

  it('el carrito muestra "99+" cuando el conteo supera 99', () => {
    // Cart count > 99 shows "99+" in the badge span
    // We test this by checking the badge text via the cart component rendering
    renderHeader({ cartCount: 150 });
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('no renderiza el boton de notificaciones (esa funcionalidad no existe en Header)', () => {
    renderHeader({ isAuthenticated: true });
    // Header does not have a notifications button
    expect(screen.queryByLabelText(/notificaciones/i)).toBeNull();
  });
});
