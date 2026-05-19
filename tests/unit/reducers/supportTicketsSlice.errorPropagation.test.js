/**
 * Tests — propagacion de errores tipados en supportTicketsSlice.
 */
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import supportTicketsReducer, {
  createSupportTicket,
  fetchSupportTickets,
} from '@redux/slices/supportTicketsSlice';
import errorReducer, { selectContextError } from '@redux/slices/errorSlice';
import { errorHandlingMiddleware } from '@redux/middleware/errorHandling';
import {
  InternalServerError,
  ValidationError,
} from '@utils/apiErrors';

const makeStore = () =>
  configureStore({
    reducer: { supportTickets: supportTicketsReducer, error: errorReducer },
    middleware: (g) => g().concat(errorHandlingMiddleware),
  });

afterEach(() => jest.clearAllMocks());

describe('supportTicketsSlice — propagacion de errores tipados', () => {
  it('500 en fetch llega a errorSlice como statusCode 500', async () => {
    apiService.get.mockRejectedValue(new InternalServerError());
    const store = makeStore();
    await store.dispatch(fetchSupportTickets());
    expect(selectContextError('supportTickets')(store.getState())).toMatchObject({
      statusCode: 500,
      code:       'INTERNAL_SERVER_ERROR',
    });
  });

  it('422 en createSupportTicket preserva validationErrors', async () => {
    apiService.post.mockRejectedValue(
      new ValidationError('Datos invalidos', { subject: ['requerido'] }),
    );
    const store = makeStore();
    await store.dispatch(createSupportTicket({ subject: '' }));
    expect(store.getState().supportTickets.actionError).toMatchObject({
      statusCode:       422,
      validationErrors: { subject: ['requerido'] },
    });
  });
});
