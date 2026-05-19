/**
 * Tests — WishlistPage (UC-WISH-02 + UC-WISH-03)
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
import wishlistReducer from '../../redux/slices/wishlistSlice';
import WishlistPage from './WishlistPage';

const ITEM_1 = {
  id: 1, product_id: 7,
  product: {
    id: 7, name: 'Collar Yemayá', slug: 'collar-yemaya',
    image: '/img/yemaya.jpg', base_price: 250, price_with_tax: 290,
  },
  variant: null,
  price_at_add: 300,
  availability: 'IN_STOCK',
  price_dropped: true,
  price_drop_percent: 16,
};
const ITEM_2 = {
  id: 2, product_id: 8,
  product: {
    id: 8, name: 'Pulsera Oshún', slug: 'pulsera-oshun',
    image: null, base_price: 120, price_with_tax: 140,
  },
  variant: null,
  price_at_add: 120,
  availability: 'OUT_OF_STOCK',
  price_dropped: false,
};

const makeStore = () =>
  configureStore({ reducer: { wishlist: wishlistReducer } });

const renderPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <Provider store={makeStore()}>
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <WishlistPage />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
};

afterEach(() => jest.clearAllMocks());

describe('WishlistPage (UC-WISH-02 + UC-WISH-03)', () => {
  it('muestra titulo Lista de deseos', async () => {
    apiService.get.mockResolvedValue({ data: { results: [], total_items: 0 } });
    renderPage();
    expect(
      await screen.findByRole('heading', { name: /lista de deseos/i }),
    ).toBeInTheDocument();
  });

  it('renderiza los productos guardados con nombre y precio', async () => {
    apiService.get.mockResolvedValue({
      data: { results: [ITEM_1, ITEM_2], total_items: 2 },
    });
    renderPage();
    expect(await screen.findByText('Collar Yemayá')).toBeInTheDocument();
    expect(screen.getByText('Pulsera Oshún')).toBeInTheDocument();
  });

  it('marca el item OUT_OF_STOCK como sin stock', async () => {
    apiService.get.mockResolvedValue({
      data: { results: [ITEM_2], total_items: 1, items_out_of_stock: 0 },
    });
    renderPage();
    await screen.findByText('Pulsera Oshún');
    // Detectar el chip de disponibilidad por la clase
    const chips = screen.getAllByText(/sin stock/i);
    expect(chips.length).toBeGreaterThan(0);
  });

  it('destaca el indicador de rebaja cuando price_dropped=true', async () => {
    apiService.get.mockResolvedValue({
      data: { results: [ITEM_1], total_items: 1 },
    });
    renderPage();
    await screen.findByText('Collar Yemayá');
    expect(screen.getByText(/rebaja/i)).toBeInTheDocument();
    expect(screen.getByText(/16%/)).toBeInTheDocument();
  });

  it('muestra mensaje vacio cuando la lista no tiene items', async () => {
    apiService.get.mockResolvedValue({
      data: { results: [], total_items: 0 },
    });
    renderPage();
    expect(
      await screen.findByText(/tu lista de deseos esta vacia/i),
    ).toBeInTheDocument();
  });

  it('UC-WISH-02: eliminar item llama DELETE y desaparece', async () => {
    apiService.get.mockResolvedValue({
      data: { results: [ITEM_1], total_items: 1 },
    });
    apiService.delete.mockResolvedValue({});
    renderPage();
    await screen.findByText('Collar Yemayá');
    fireEvent.click(
      screen.getByRole('button', { name: /eliminar collar yemayá de la lista/i }),
    );
    await waitFor(() =>
      expect(apiService.delete).toHaveBeenCalledWith('/api/v1/wishlist/1/'),
    );
  });

  it('UC-WISH-03: mover al carrito invoca el endpoint move-to-cart', async () => {
    apiService.get.mockResolvedValue({
      data: { results: [ITEM_1], total_items: 1 },
    });
    apiService.post.mockResolvedValue({ data: {} });
    renderPage();
    await screen.findByText('Collar Yemayá');
    fireEvent.click(
      screen.getByRole('button', { name: /mover collar yemayá al carrito/i }),
    );
    await waitFor(() =>
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/wishlist/1/move-to-cart/',
        { quantity: 1, keep_in_wishlist: false },
      ),
    );
  });

  it('UC-WISH-03: si el item esta sin stock, el boton mover esta deshabilitado', async () => {
    apiService.get.mockResolvedValue({
      data: { results: [ITEM_2], total_items: 1 },
    });
    renderPage();
    await screen.findByText('Pulsera Oshún');
    expect(
      screen.getByRole('button', { name: /mover pulsera oshún al carrito/i }),
    ).toBeDisabled();
  });
});
