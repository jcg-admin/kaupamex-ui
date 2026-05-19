/**
 * Tests — yorubaVariantsSlice (D-010)
 * Verifica el patron canonico: errores tipados via serializeApiError
 * preservan code / statusCode / validationErrors.
 */
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: {
    get: jest.fn(), post: jest.fn(),
    patch: jest.fn(), put: jest.fn(), delete: jest.fn(),
  },
}));

import apiService from '@services/apiService';

import yorubaVariantsReducer, {
  fetchAdminVariants,
  createVariant,
  toggleVariantActive,
  setVariantPrice,
  clearVariantPrice,
  selectVariant,
  clearSelectedVariant,
} from './yorubaVariantsSlice';

// Reproducimos la APIError minima que apiService propaga.
class APIError extends Error {
  constructor({ message, code, statusCode, validationErrors, body }) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.statusCode = statusCode;
    this.validationErrors = validationErrors;
    this.body = body;
  }
}

const makeStore = () => configureStore({
  reducer: { yorubaVariants: yorubaVariantsReducer },
});

afterEach(() => jest.clearAllMocks());

describe('yorubaVariantsSlice — error propagation (D-010)', () => {
  it('fetchAdminVariants.rejected preserva statusCode y code', async () => {
    apiService.get.mockRejectedValue(new APIError({
      message: 'no autorizado',
      code: 'AUTH_REQUIRED',
      statusCode: 401,
    }));
    const store = makeStore();
    await store.dispatch(fetchAdminVariants(7));
    const { error } = store.getState().yorubaVariants;
    expect(error).toMatchObject({
      message: 'no autorizado',
      code: 'AUTH_REQUIRED',
      statusCode: 401,
    });
  });

  it('createVariant.rejected preserva validationErrors del backend', async () => {
    apiService.post.mockRejectedValue(new APIError({
      message: 'campos invalidos',
      code: 'VARIANTE_DUPLICADA',
      statusCode: 409,
      validationErrors: { option_name: ['ya existe'] },
    }));
    const store = makeStore();
    await store.dispatch(createVariant({
      productId: 7, variantType: 'TAMAÑO', optionName: 'Grande',
    }));
    const { actionError } = store.getState().yorubaVariants;
    expect(actionError).toMatchObject({
      code: 'VARIANTE_DUPLICADA',
      statusCode: 409,
      validationErrors: { option_name: ['ya existe'] },
    });
  });

  it('toggleVariantActive.rejected almacena objeto serializado', async () => {
    apiService.patch.mockRejectedValue(new APIError({
      message: 'forbidden', code: 'FORBIDDEN', statusCode: 403,
    }));
    const store = makeStore();
    await store.dispatch(toggleVariantActive({
      productId: 7, variantId: 1, isActive: false,
    }));
    const { actionError } = store.getState().yorubaVariants;
    expect(actionError).toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
  });

  it('setVariantPrice.rejected almacena objeto serializado', async () => {
    apiService.put.mockRejectedValue(new APIError({
      message: 'precio invalido', code: 'PRECIO_INVALIDO', statusCode: 400,
    }));
    const store = makeStore();
    await store.dispatch(setVariantPrice({ variantId: 1, price: -10 }));
    const { actionError } = store.getState().yorubaVariants;
    expect(actionError).toMatchObject({
      statusCode: 400, code: 'PRECIO_INVALIDO',
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
    apiService.get.mockResolvedValue({
      data: { results: [{ id: 1, option_name: 'Grande' }] },
    });
    const store = makeStore();
    await store.dispatch(fetchAdminVariants(7));
    expect(store.getState().yorubaVariants.adminVariants).toEqual(
      [{ id: 1, option_name: 'Grande' }],
    );
  });

  it('clearVariantPrice.fulfilled marca price=null (no regresion)', async () => {
    // Seed admin variants
    apiService.get.mockResolvedValue({ data: [{ id: 9, price: 100 }] });
    const store = makeStore();
    await store.dispatch(fetchAdminVariants(7));
    apiService.delete.mockResolvedValue({ data: {} });
    await store.dispatch(clearVariantPrice(9));
    expect(store.getState().yorubaVariants.adminVariants[0]).toMatchObject({
      id: 9, price: null,
    });
  });
});
