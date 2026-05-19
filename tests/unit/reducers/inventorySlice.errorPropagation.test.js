/**
 * Tests — propagacion de errores tipados en inventorySlice.
 */
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import inventoryReducer, {
  fetchInventory,
  adjustStockManually,
  importProductsCsv,
} from '@redux/slices/inventorySlice';
import errorReducer, { selectContextError } from '@redux/slices/errorSlice';
import { errorHandlingMiddleware } from '@redux/middleware/errorHandling';
import {
  ValidationError,
  InternalServerError,
  BadRequestError,
} from '@utils/apiErrors';

const makeStore = () =>
  configureStore({
    reducer: { inventory: inventoryReducer, error: errorReducer },
    middleware: (g) => g().concat(errorHandlingMiddleware),
  });

afterEach(() => jest.clearAllMocks());

describe('inventorySlice — propagacion de errores tipados', () => {
  it('500 en fetchInventory llega a errorSlice', async () => {
    apiService.get.mockRejectedValue(new InternalServerError());
    const store = makeStore();
    await store.dispatch(fetchInventory());
    expect(selectContextError('inventory')(store.getState())).toMatchObject({
      statusCode: 500,
      code:       'INTERNAL_SERVER_ERROR',
    });
  });

  it('422 en adjustStockManually preserva validationErrors', async () => {
    apiService.post.mockRejectedValue(
      new ValidationError('Cantidad invalida', { new_quantity: ['negativa'] }),
    );
    const store = makeStore();
    await store.dispatch(adjustStockManually({
      variantId: 1, newQuantity: -1, reason: '',
    }));
    expect(store.getState().inventory.actionError).toMatchObject({
      statusCode:       422,
      validationErrors: { new_quantity: ['negativa'] },
    });
  });

  it('400 en importProductsCsv conserva message', async () => {
    apiService.post.mockRejectedValue(new BadRequestError('CSV malformado'));
    const store = makeStore();
    await store.dispatch(importProductsCsv({ file: new Blob(), initialState: 'BORRADOR' }));
    expect(store.getState().inventory.actionError).toMatchObject({
      statusCode: 400,
      message:    'CSV malformado',
    });
  });
});
