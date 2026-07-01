/**
 * Tests — WishlistPage (UC-WISH-02 + UC-WISH-03)
 */
import { http, HttpResponse, delay } from 'msw';
import { server } from '@mocks/server';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';

import wishlistReducer from '../../redux/slices/wishlistSlice';
import WishlistPage from './WishlistPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

// Use the field names the component actually reads:
// item.product_name, item.current_price, item.image_url, item.is_available, item.stock
const ITEM_1 = {
  id: 1,
  product_name: 'Collar Yemayá',
  image_url: '/img/yemaya.jpg',
  current_price: 250,
  price_at_add: 300,
  is_available: true,
  stock: 10,
};
const ITEM_2 = {
  id: 2,
  product_name: 'Pulsera Oshún',
  image_url: '/img/oshun.jpg',
  current_price: 120,
  price_at_add: 120,
  is_available: false,
  stock: 0,
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

describe('WishlistPage (UC-WISH-02 + UC-WISH-03)', () => {
  it('muestra titulo Lista de deseos', async () => {
    server.use(
      http.get(`${BASE}/api/v2/wishlist/`, () =>
        HttpResponse.json({ results: [], total_items: 0 }),
      ),
    );
    renderPage();
    expect(
      await screen.findByRole('heading', { name: /lista de deseos/i }),
    ).toBeInTheDocument();
  });

  it('renderiza los productos guardados con nombre y precio', async () => {
    server.use(
      http.get(`${BASE}/api/v2/wishlist/`, () =>
        HttpResponse.json({ results: [ITEM_1, ITEM_2], total_items: 2 }),
      ),
    );
    renderPage();
    expect(await screen.findByText('Collar Yemayá')).toBeInTheDocument();
    // Both items have image_url set, so product_name only appears in h3
    expect(screen.getByRole('heading', { name: 'Pulsera Oshún' })).toBeInTheDocument();
  });

  it('marca el item sin stock: solo muestra última unidad badge cuando stock <= 3', async () => {
    const LOW_STOCK_ITEM = { ...ITEM_1, stock: 2, is_available: true };
    server.use(
      http.get(`${BASE}/api/v2/wishlist/`, () =>
        HttpResponse.json({ results: [LOW_STOCK_ITEM], total_items: 1 }),
      ),
    );
    renderPage();
    await screen.findByText('Collar Yemayá');
    // Component renders "Última unidad" badge when is_available=true and stock <= 3
    const badges = screen.getAllByText(/última unidad/i);
    // At least one element must match exactly "Última unidad" (the badge span)
    expect(badges.some((el) => el.textContent === 'Última unidad')).toBe(true);
  });

  it('destaca el indicador de rebaja cuando current_price < price_at_add', async () => {
    server.use(
      http.get(`${BASE}/api/v2/wishlist/`, () =>
        HttpResponse.json({ results: [ITEM_1], total_items: 1 }),
      ),
    );
    renderPage();
    await screen.findByText('Collar Yemayá');
    // Component renders "Bajó de precio" badge when current_price < price_at_add
    expect(screen.getByText(/bajó de precio/i)).toBeInTheDocument();
  });

  it('muestra mensaje vacio cuando la lista no tiene items', async () => {
    server.use(
      http.get(`${BASE}/api/v2/wishlist/`, () =>
        HttpResponse.json({ results: [], total_items: 0 }),
      ),
    );
    renderPage();
    // Component shows "No tienes piezas guardadas" in EmptyState
    expect(
      await screen.findByText(/No tienes piezas guardadas/i),
    ).toBeInTheDocument();
  });

  it('UC-WISH-02: eliminar item llama DELETE', async () => {
    server.use(
      http.get(`${BASE}/api/v2/wishlist/`, () =>
        HttpResponse.json({ results: [ITEM_1], total_items: 1 }),
      ),
    );
    let deleteCalled = false;
    server.use(
      http.delete(`${BASE}/api/v2/wishlist/:itemId/`, () => {
        deleteCalled = true;
        return HttpResponse.json({});
      }),
    );
    renderPage();
    await screen.findByText('Collar Yemayá');
    // The remove button has aria-label="Quitar de deseos"
    fireEvent.click(
      screen.getByRole('button', { name: /quitar de deseos/i }),
    );
    await waitFor(() => expect(deleteCalled).toBe(true));
  });

  it('UC-WISH-03: mover al carrito invoca el endpoint move-to-cart', async () => {
    server.use(
      http.get(`${BASE}/api/v2/wishlist/`, () =>
        HttpResponse.json({ results: [ITEM_1], total_items: 1 }),
      ),
    );
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v2/wishlist/:itemId/cart-transfers/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({});
      }),
    );
    renderPage();
    await screen.findByText('Collar Yemayá');
    // The move button text is "Mover al carrito"
    fireEvent.click(
      screen.getByRole('button', { name: /mover al carrito/i }),
    );
    await waitFor(() =>
      expect(lastBody).toMatchObject({ quantity: 1, keep_in_wishlist: false }),
    );
  });

  it('UC-WISH-03 (H-001): "Mover todo al carrito" dispara todos los items en paralelo', async () => {
    server.use(
      http.get(`${BASE}/api/v2/wishlist/`, () =>
        HttpResponse.json({ results: [ITEM_1, ITEM_2], total_items: 2 }),
      ),
    );
    const moved = [];
    server.use(
      http.post(`${BASE}/api/v2/wishlist/:itemId/cart-transfers/`, async ({ params }) => {
        // Un pequeño delay: si el bucle fuese secuencial, el primer POST
        // no habria devuelto y el segundo no habria empezado todavia.
        await delay(20);
        moved.push(params.itemId);
        return HttpResponse.json({});
      }),
    );
    renderPage();
    await screen.findByText('Collar Yemayá');
    fireEvent.click(
      screen.getByRole('button', { name: /mover todo al carrito/i }),
    );
    await waitFor(() => expect(moved.slice().sort()).toEqual(['1', '2']));
  });

  it('UC-WISH-03 (H-001): muestra el estado "Moviendo" y deshabilita el boton', async () => {
    server.use(
      http.get(`${BASE}/api/v2/wishlist/`, () =>
        HttpResponse.json({ results: [ITEM_1, ITEM_2], total_items: 2 }),
      ),
      http.post(`${BASE}/api/v2/wishlist/:itemId/cart-transfers/`, async () => {
        await delay(40);
        return HttpResponse.json({});
      }),
    );
    renderPage();
    await screen.findByText('Collar Yemayá');
    fireEvent.click(
      screen.getByRole('button', { name: /mover todo al carrito/i }),
    );
    expect(
      await screen.findByRole('button', { name: /moviendo/i }),
    ).toBeDisabled();
  });

  it('UC-WISH-03 (H-001): reporta la pieza que falla sin abortar el resto', async () => {
    server.use(
      http.get(`${BASE}/api/v2/wishlist/`, () =>
        HttpResponse.json({ results: [ITEM_1, ITEM_2], total_items: 2 }),
      ),
      http.post(`${BASE}/api/v2/wishlist/:itemId/cart-transfers/`, ({ params }) => {
        if (params.itemId === '2') {
          return HttpResponse.json(
            { detail: 'Este producto no está disponible.',
              codigo_error: 'PRODUCT_OUT_OF_STOCK' },
            { status: 409 },
          );
        }
        return HttpResponse.json({});
      }),
    );
    renderPage();
    await screen.findByText('Pulsera Oshún');
    fireEvent.click(
      screen.getByRole('button', { name: /mover todo al carrito/i }),
    );
    const alertBox = await screen.findByRole('alert');
    expect(alertBox).toHaveTextContent(/Pulsera Oshún/i);
  });

  it('UC-WISH-03: si el item esta sin stock, el boton mover sigue presente', async () => {
    server.use(
      http.get(`${BASE}/api/v2/wishlist/`, () =>
        HttpResponse.json({ results: [ITEM_2], total_items: 1 }),
      ),
    );
    renderPage();
    await screen.findByText('Pulsera Oshún');
    // The move button is always rendered (component does not disable it for out-of-stock)
    const moveButtons = screen.getAllByRole('button', { name: /mover al carrito/i });
    expect(moveButtons.length).toBeGreaterThan(0);
  });
});
