/**
 * Tests — propagacion de errores tipados en vouchersSlice.
 *
 * Verifica que el thunk serializa correctamente los errores de
 * apiErrors.js y que el errorHandlingMiddleware los registra en
 * errorSlice.contextErrors.vouchers con statusCode + code.
 */
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import vouchersReducer, {
  fetchVouchers,
  createVoucher,
} from '@redux/slices/vouchersSlice';
import errorReducer, {
  selectContextError,
} from '@redux/slices/errorSlice';
import { errorHandlingMiddleware } from '@redux/middleware/errorHandling';
import {
  InternalServerError,
  ValidationError,
  ConflictError,
} from '@utils/apiErrors';

const makeStore = () =>
  configureStore({
    reducer: { vouchers: vouchersReducer, error: errorReducer },
    middleware: (getDef) => getDef().concat(errorHandlingMiddleware),
  });

afterEach(() => jest.clearAllMocks());

describe('vouchersSlice — propagacion de errores tipados', () => {
  it('un 500 de fetchVouchers aterriza en errorSlice con statusCode 500', async () => {
    apiService.get.mockRejectedValue(new InternalServerError());
    const store = makeStore();

    await store.dispatch(fetchVouchers());

    const ctxError = selectContextError('vouchers')(store.getState());
    expect(ctxError).toMatchObject({
      statusCode: 500,
      code:       'INTERNAL_SERVER_ERROR',
    });
  });

  it('un 422 de createVoucher preserva validationErrors', async () => {
    apiService.post.mockRejectedValue(
      new ValidationError('Datos invalidos', { code: ['ya existe'] }),
    );
    const store = makeStore();

    await store.dispatch(createVoucher({ code: 'X' }));

    const ctxError = selectContextError('vouchers')(store.getState());
    expect(ctxError).toMatchObject({
      statusCode: 422,
      code:       'VALIDATION_ERROR',
    });
    // El payload del slice tambien guarda validationErrors
    expect(store.getState().vouchers.actionError).toMatchObject({
      validationErrors: { code: ['ya existe'] },
    });
  });

  it('un 409 conflicto se propaga con code CONFLICT', async () => {
    apiService.post.mockRejectedValue(new ConflictError('Codigo ya usado'));
    const store = makeStore();

    await store.dispatch(createVoucher({ code: 'X' }));

    const ctxError = selectContextError('vouchers')(store.getState());
    expect(ctxError).toMatchObject({
      statusCode: 409,
      code:       'CONFLICT',
    });
  });
});
