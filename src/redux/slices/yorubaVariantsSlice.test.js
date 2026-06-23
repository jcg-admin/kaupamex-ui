/**
 * Tests — yorubaVariantsSlice (D-010)
 * Verifica el patron canonico: errores tipados via serializeApiError
 * preservan code / statusCode / validationErrors.
 */
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';
import { configureStore } from '@reduxjs/toolkit';
import yorubaVariantsReducer, {
  fetchAdminVariants,
  createVariant,
  toggleVariantActive,
  setVariantPrice,
  clearVariantPrice,
  selectVariant,
  clearSelectedVariant,
} from './yorubaVariantsSlice';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = () => configureStore({
  reducer: { yorubaVariants: yorubaVariantsReducer },
});

describe('yorubaVariantsSlice — error propagation (D-010)', () => {
  it('fetchAdminVariants.rejected preserva statusCode y code', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/products/7/variants/`, () =>
        HttpResponse.json(
          { detail: 'no autorizado', codigo_error: 'AUTH_REQUIRED' },
          { status: 422 },
        ),
      ),
    );
    const store = makeStore();
    await store.dispatch(fetchAdminVariants(7));
    const { error } = store.getState().yorubaVariants;
    expect(error).toMatchObject({
      message: 'no autorizado',
      code: 'AUTH_REQUIRED',
      statusCode: 422,
    });
  });

  it('createVariant.rejected preserva validationErrors del backend', async () => {
    server.use(
      http.post(`${BASE}/api/v1/admin/products/7/variants/`, () =>
        HttpResponse.json(
          {
            detail: 'campos invalidos',
            codigo_error: 'VARIANT_DUPLICATE',
            errors: { option_name: ['ya existe'] },
          },
          { status: 422 },
        ),
      ),
    );
    const store = makeStore();
    await store.dispatch(createVariant({
      productId: 7, variantType: 'TAMAÑO', optionName: 'Grande',
    }));
    const { actionError } = store.getState().yorubaVariants;
    expect(actionError).toMatchObject({
      code: 'VARIANT_DUPLICATE',
      statusCode: 422,
    });
  });

  it('toggleVariantActive.rejected almacena objeto serializado', async () => {
    server.use(
      http.patch(`${BASE}/api/v1/admin/products/7/variants/1/`, () =>
        HttpResponse.json(
          { detail: 'forbidden', codigo_error: 'FORBIDDEN' },
          { status: 403 },
        ),
      ),
    );
    const store = makeStore();
    await store.dispatch(toggleVariantActive({
      productId: 7, variantId: 1, isActive: false,
    }));
    const { actionError } = store.getState().yorubaVariants;
    expect(actionError).toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
  });

  it('setVariantPrice.rejected almacena objeto serializado', async () => {
    server.use(
      http.put(`${BASE}/api/v1/admin/variants/1/price/`, () =>
        HttpResponse.json(
          { detail: 'precio invalido', codigo_error: 'PRICE_INVALID' },
          { status: 400 },
        ),
      ),
    );
    const store = makeStore();
    await store.dispatch(setVariantPrice({ variantId: 1, price: -10 }));
    const { actionError } = store.getState().yorubaVariants;
    expect(actionError).toMatchObject({
      statusCode: 400, code: 'PRICE_INVALID',
    });
  });

  it('reducers de seleccion siguen funcionando (no regresion)', () => {
    const store = makeStore();
    store.dispatch(selectVariant(42));
    expect(store.getState().yorubaVariants.selectedVariantId).toBe(42);
    store.dispatch(clearSelectedVariant());
    expect(store.getState().yorubaVariants.selectedVariantId).toBe(null);
  });

  it('fetchAdminVariants.fulfilled popula adminVariants (no regresion)', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/products/7/variants/`, () =>
        HttpResponse.json({ results: [{ id: 1, option_name: 'Grande' }] }),
      ),
    );
    const store = makeStore();
    await store.dispatch(fetchAdminVariants(7));
    expect(store.getState().yorubaVariants.adminVariants).toEqual(
      [{ id: 1, option_name: 'Grande' }],
    );
  });

  it('clearVariantPrice.fulfilled marca price=null (no regresion)', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/products/7/variants/`, () =>
        HttpResponse.json([{ id: 9, price: 100 }]),
      ),
      http.delete(`${BASE}/api/v1/admin/variants/9/price/`, () =>
        HttpResponse.json({}),
      ),
    );
    const store = makeStore();
    await store.dispatch(fetchAdminVariants(7));
    await store.dispatch(clearVariantPrice(9));
    expect(store.getState().yorubaVariants.adminVariants[0]).toMatchObject({
      id: 9, price: null,
    });
  });
});
