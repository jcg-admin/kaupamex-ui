/**
 * Tests — AddToWishlistButton (UC-WISH-01)
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

import authReducer from '../../redux/slices/authSlice';
import wishlistReducer from '../../redux/slices/wishlistSlice';
import AddToWishlistButton from './AddToWishlistButton';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = (authenticated = true) =>
  configureStore({
    reducer: { auth: authReducer, wishlist: wishlistReducer },
    preloadedState: {
      auth: {
        user: authenticated ? { id: 1 } : null,
        isAuthenticated: authenticated,
        isLoading: false, error: null,
      },
    },
  });

const renderBtn = ({ authenticated = true, productId = 7, variantId = null } = {}) =>
  render(
    <Provider store={makeStore(authenticated)}>
      <MemoryRouter>
        <AddToWishlistButton productId={productId} variantId={variantId} />
      </MemoryRouter>
    </Provider>,
  );

afterEach(() => {
  mockNavigate.mockReset();
});

describe('AddToWishlistButton (UC-WISH-01)', () => {
  it('renderiza el boton con icono y texto inicial', () => {
    renderBtn();
    expect(
      screen.getByRole('button', { name: /agregar a lista de deseos/i }),
    ).toBeInTheDocument();
  });

  it('si no esta autenticado redirige a login y no llama al API', () => {
    let called = false;
    server.use(
      http.post(`${BASE}/api/v2/wishlist/`, () => {
        called = true;
        return HttpResponse.json({});
      }),
    );
    renderBtn({ authenticated: false });
    fireEvent.click(screen.getByRole('button'));
    expect(mockNavigate).toHaveBeenCalledWith(
      '/auth/login',
      expect.objectContaining({ state: expect.objectContaining({ from: expect.anything() }) }),
    );
    expect(called).toBe(false);
  });

  it('agrega el producto y muestra confirmacion visual', async () => {
    server.use(
      http.post(`${BASE}/api/v2/wishlist/`, () =>
        HttpResponse.json({ id: 1, product_id: 7 }),
      ),
    );
    renderBtn({ productId: 7 });
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /producto en lista de deseos/i }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText(/en tu lista/i)).toBeInTheDocument();
  });

  it('envia variant_id cuando corresponde (Alternativa B)', async () => {
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v2/wishlist/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({ id: 1 });
      }),
    );
    renderBtn({ productId: 7, variantId: 3 });
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() =>
      expect(lastBody).toMatchObject({ product_id: 7, variant_id: 3 }),
    );
  });

  it('muestra aviso cuando el producto ya esta en la lista (409)', async () => {
    server.use(
      http.post(`${BASE}/api/v2/wishlist/`, () =>
        HttpResponse.json(
          { detail: 'ya esta en la lista', codigo_error: 'PRODUCT_ALREADY_IN_WISHLIST' },
          { status: 409 },
        ),
      ),
    );
    renderBtn();
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() =>
      expect(screen.getByText(/ya esta en tu lista/i)).toBeInTheDocument(),
    );
  });

  it('H-003: discrimina el duplicado por el codigo canonico del backend', async () => {
    // El backend emite `PRODUCT_ALREADY_IN_WISHLIST` (valor en ingles, canon
    // del repo). Se entrega SIN 409 para aislar el discriminador por codigo
    // del fallback por statusCode: solo el match de `code` puede mostrar el
    // aviso especifico.
    server.use(
      http.post(`${BASE}/api/v2/wishlist/`, () =>
        HttpResponse.json(
          { detail: 'ya esta en la lista', codigo_error: 'PRODUCT_ALREADY_IN_WISHLIST' },
          { status: 400 },
        ),
      ),
    );
    renderBtn();
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() =>
      expect(screen.getByText(/ya esta en tu lista/i)).toBeInTheDocument(),
    );
  });
});
