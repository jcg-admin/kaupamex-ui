/**
 * Tests — AddToWishlistButton (UC-WISH-01)
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: {
    get: jest.fn(), post: jest.fn(),
    patch: jest.fn(), delete: jest.fn(),
  },
}));

import apiService from '@services/apiService';
import authReducer from '../../redux/slices/authSlice';
import wishlistReducer from '../../redux/slices/wishlistSlice';
import AddToWishlistButton from './AddToWishlistButton';

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
  jest.clearAllMocks();
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
    renderBtn({ authenticated: false });
    fireEvent.click(screen.getByRole('button'));
    expect(mockNavigate).toHaveBeenCalledWith('/auth/login');
    expect(apiService.post).not.toHaveBeenCalled();
  });

  it('agrega el producto y muestra confirmacion visual', async () => {
    apiService.post.mockResolvedValue({ data: { id: 1, product_id: 7 } });
    renderBtn({ productId: 7 });
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /producto en lista de deseos/i }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText(/en tu lista/i)).toBeInTheDocument();
    expect(apiService.post).toHaveBeenCalledWith(
      '/api/v1/wishlist/',
      { product_id: 7 },
    );
  });

  it('envia variant_id cuando corresponde (Alternativa B)', async () => {
    apiService.post.mockResolvedValue({ data: { id: 1 } });
    renderBtn({ productId: 7, variantId: 3 });
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() =>
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/wishlist/',
        { product_id: 7, variant_id: 3 },
      ),
    );
  });

  it('muestra aviso cuando el producto ya esta en la lista (409)', async () => {
    const err = Object.assign(new Error('ya'), {
      name: 'APIError',
      code: 'PRODUCTO_YA_EN_WISHLIST',
      statusCode: 409,
    });
    // Hacer que serializeApiError no lo reconozca como APIError:
    // ajustamos solo body/code para fluir por la ruta de plano.
    apiService.post.mockRejectedValue({
      code: 'PRODUCTO_YA_EN_WISHLIST',
      status: 409,
      message: 'ya esta en la lista',
    });
    renderBtn();
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() =>
      expect(screen.getByText(/ya esta en tu lista/i)).toBeInTheDocument(),
    );
  });
});
