/**
 * Tests — propagacion de errores tipados en returnsSlice.
 */
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import returnsReducer, {
  createReturnRequest,
  approveReturnRequest,
  processReturnRefund,
} from '@redux/slices/returnsSlice';
import errorReducer, { selectContextError } from '@redux/slices/errorSlice';
import { errorHandlingMiddleware } from '@redux/middleware/errorHandling';
import {
  ConflictError,
  ValidationError,
  InternalServerError,
} from '@utils/apiErrors';

const makeStore = () =>
  configureStore({
    reducer: { returns: returnsReducer, error: errorReducer },
    middleware: (g) => g().concat(errorHandlingMiddleware),
  });

afterEach(() => jest.clearAllMocks());

describe('returnsSlice — propagacion de errores tipados', () => {
  it('409 al crear devolucion (fuera de plazo) lleva code CONFLICT a errorSlice', async () => {
    apiService.post.mockRejectedValue(new ConflictError('Fuera de plazo'));
    const store = makeStore();
    await store.dispatch(createReturnRequest({}));
    expect(selectContextError('returns')(store.getState())).toMatchObject({
      statusCode: 409,
      code:       'CONFLICT',
    });
  });

  it('422 al aprobar preserva validationErrors', async () => {
    apiService.post.mockRejectedValue(
      new ValidationError('Items invalidos', { items: ['vacio'] }),
    );
    const store = makeStore();
    await store.dispatch(approveReturnRequest({ id: 1, justification: '' }));
    expect(store.getState().returns.actionError).toMatchObject({
      statusCode:       422,
      validationErrors: { items: ['vacio'] },
    });
  });

  it('500 al procesar reembolso llega a globalError/contextErrors', async () => {
    apiService.post.mockRejectedValue(new InternalServerError());
    const store = makeStore();
    await store.dispatch(processReturnRefund({ id: 1, amount: 10 }));
    expect(selectContextError('returns')(store.getState())).toMatchObject({
      statusCode: 500,
    });
  });
});
