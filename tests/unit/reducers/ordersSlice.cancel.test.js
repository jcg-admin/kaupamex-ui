/**
 * Tests — ordersSlice.cancelOrder (UC-ORD-04 — comprador cancela)
 */
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

import apiService from '@services/apiService';
import ordersReducer, { cancelOrder } from '@redux/slices/ordersSlice';
import { APIError } from '@utils/apiErrors';

const makeStore = () =>
  configureStore({ reducer: { orders: ordersReducer } });

afterEach(() => jest.clearAllMocks());

describe('ordersSlice — cancelOrder (UC-ORD-04)', () => {
  it('llama POST /api/v1/orders/<order_number>/cancel/ con reason', async () => {
    apiService.post.mockResolvedValue({
      data: { order_number: 'PY-2026-000001', status: 'CANCELLED' },
    });
    const store = makeStore();
    await store.dispatch(cancelOrder({
      orderNumber: 'PY-2026-000001',
      reason:      'Cambio de opinion',
    }));
    expect(apiService.post).toHaveBeenCalledWith(
      '/api/v1/orders/PY-2026-000001/cancel/',
      { reason: 'Cambio de opinion' },
    );
    const state = store.getState().orders;
    expect(state.lastAction).toBe('cancelled');
    expect(state.lastOrderNumber).toBe('PY-2026-000001');
  });

  it('propaga error tipado (409 CANCELACION_NO_PERMITIDA)', async () => {
    const err = new APIError('No cancelable', 'CONFLICT', 409);
    apiService.post.mockRejectedValue(err);

    const store = makeStore();
    await store.dispatch(cancelOrder({
      orderNumber: 'PY-2026-000001',
      reason:      '',
    }));
    const state = store.getState().orders;
    expect(state.actionError).toMatchObject({
      code:       'CONFLICT',
      statusCode: 409,
    });
  });
});
