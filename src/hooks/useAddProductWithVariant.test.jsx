/**
 * Tests — useAddProductWithVariant
 * UC-CHT-02: Seleccionar Variante al Agregar al Carrito.
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import cartReducer       from '@redux/slices/cartSlice';
import yorubaVariantsReducer, {
  selectVariant,
} from '@redux/slices/yorubaVariantsSlice';
import useAddProductWithVariant from './useAddProductWithVariant';

const BASE = process.env.API_URL || 'http://localhost:8000';

const buildStore = () =>
  configureStore({
    reducer: {
      cart:           cartReducer,
      yorubaVariants: yorubaVariantsReducer,
    },
  });

const wrap = (store) => ({ children }) => (
  <Provider store={store}>{children}</Provider>
);

const PRODUCT_WITH_VARIANTS = {
  id: 7,
  name: 'Collar Yemayá',
  variants: [
    { id: 201, name: 'Chico',   price: 800, stock: 4, is_active: true },
    { id: 202, name: 'Mediano', price: 1200, stock: 0, is_active: true },
  ],
};

const PRODUCT_WITHOUT_VARIANTS = {
  id: 8,
  name: 'Vela Ogún',
  variants: [],
};

describe('useAddProductWithVariant (UC-CHT-02)', () => {
  it('rechaza si el producto tiene variantes y no hay ninguna seleccionada', async () => {
    const store = buildStore();
    const { result } = renderHook(
      () => useAddProductWithVariant(),
      { wrapper: wrap(store) },
    );

    let outcome;
    await act(async () => {
      outcome = await result.current.addProduct(PRODUCT_WITH_VARIANTS, 1);
    });

    expect(outcome.ok).toBe(false);
    expect(outcome.error).toBe('VARIANT_REQUIRED');
  });

  it('rechaza si la variante seleccionada no tiene stock disponible', async () => {
    const store = buildStore();
    store.dispatch(selectVariant(202)); // Mediano: stock 0

    const { result } = renderHook(
      () => useAddProductWithVariant(),
      { wrapper: wrap(store) },
    );

    let outcome;
    await act(async () => {
      outcome = await result.current.addProduct(PRODUCT_WITH_VARIANTS, 1);
    });

    expect(outcome.ok).toBe(false);
    expect(outcome.error).toBe('VARIANT_OUT_OF_STOCK');
  });

  it('agrega al carrito con product_id, variant_id y quantity correctos', async () => {
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v2/cart/items/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({ items: [], voucher: null });
      }),
    );

    const store = buildStore();
    store.dispatch(selectVariant(201)); // Chico: stock 4

    const { result } = renderHook(
      () => useAddProductWithVariant(),
      { wrapper: wrap(store) },
    );

    let outcome;
    await act(async () => {
      outcome = await result.current.addProduct(PRODUCT_WITH_VARIANTS, 2);
    });

    expect(outcome.ok).toBe(true);
    await waitFor(() => {
      expect(lastBody).toMatchObject({
        product_id: 7,
        variant_id: 201,
        quantity:   2,
      });
    });
  });

  it('si el producto no tiene variantes agrega sin variant_id', async () => {
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v2/cart/items/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({ items: [], voucher: null });
      }),
    );

    const store = buildStore();
    const { result } = renderHook(
      () => useAddProductWithVariant(),
      { wrapper: wrap(store) },
    );

    let outcome;
    await act(async () => {
      outcome = await result.current.addProduct(PRODUCT_WITHOUT_VARIANTS, 1);
    });

    expect(outcome.ok).toBe(true);
    await waitFor(() => {
      expect(lastBody).toMatchObject({
        product_id: 8,
        variant_id: null,
        quantity:   1,
      });
    });
  });

  it('cantidad por defecto es 1', async () => {
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v2/cart/items/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({ items: [] });
      }),
    );

    const store = buildStore();
    store.dispatch(selectVariant(201));

    const { result } = renderHook(
      () => useAddProductWithVariant(),
      { wrapper: wrap(store) },
    );

    await act(async () => {
      await result.current.addProduct(PRODUCT_WITH_VARIANTS);
    });

    await waitFor(() => {
      expect(lastBody).toMatchObject({ quantity: 1 });
    });
  });

  it('reporta el id de la variante seleccionada como `selectedVariantId`', () => {
    const store = buildStore();
    store.dispatch(selectVariant(201));

    const { result } = renderHook(
      () => useAddProductWithVariant(),
      { wrapper: wrap(store) },
    );

    expect(result.current.selectedVariantId).toBe(201);
  });
});
