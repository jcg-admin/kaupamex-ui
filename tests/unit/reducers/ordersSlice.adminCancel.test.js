/**
 * Tests — ordersSlice.adminCancelOrder (UC-ORD-08 — admin cancela con motivo)
 */
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

import apiService from '@services/apiService';
import ordersReducer, { adminCancelOrder } from '@redux/slices/ordersSlice';
import { APIError } from '@utils/apiErrors';

const makeStore = () =>
  configureStore({ reducer: { orders: ordersReducer } });

afterEach(() => jest.clearAllMocks());

describe('ordersSlice — adminCancelOrder (UC-ORD-08)', () => {
  it('llama POST /api/v1/admin/orders/:n/cancel/ con reason', async () => {
    apiService.post.mockResolvedValue({
      data: { order_number: 'PY-2026-000101', status: 'CANCELLED' },
    });
    const store = makeStore();
    await store.dispatch(adminCancelOrder({
      orderNumber: 'PY-2026-000101',
      reason:      'Cliente abandono el pedido tras 48h sin pago',
    }));
    expect(apiService.post).toHaveBeenCalledWith(
      '/api/v1/admin/orders/PY-2026-000101/cancel/',
      { reason: 'Cliente abandono el pedido tras 48h sin pago' },
    );
    const state = store.getState().orders;
    expect(state.lastAction).toBe('admin_cancelled');
  });

  it('propaga error tipado (503 GATEWAY_NO_DISPONIBLE)', async () => {
    const err = new APIError('Gateway de reembolso no disponible.', 'SERVICE_UNAVAILABLE', 503);
    apiService.post.mockRejectedValue(err);

    const store = makeStore();
    await store.dispatch(adminCancelOrder({
      orderNumber: 'PY-2026-000101',
      reason:      'motivo suficientemente largo',
    }));
    const state = store.getState().orders;
    expect(state.actionError).toMatchObject({
      code:       'SERVICE_UNAVAILABLE',
      statusCode: 503,
    });
  });
});
