/**
 * Tests — ordersSlice.updateOrderShipping (UC-ORD-06 — cambiar metodo de envio)
 */
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

import apiService from '@services/apiService';
import ordersReducer, { updateOrderShipping } from '@redux/slices/ordersSlice';
import { APIError } from '@utils/apiErrors';

const makeStore = () =>
  configureStore({ reducer: { orders: ordersReducer } });

afterEach(() => jest.clearAllMocks());

describe('ordersSlice — updateOrderShipping (UC-ORD-06)', () => {
  it('llama PATCH /shipping/ con el nuevo shipping_method_id', async () => {
    apiService.patch.mockResolvedValue({
      data: { order_number: 'PY-2026-000001', shipping_method_name: 'Express' },
    });
    const store = makeStore();
    await store.dispatch(updateOrderShipping({
      orderNumber:      'PY-2026-000001',
      shippingMethodId: 3,
    }));
    expect(apiService.patch).toHaveBeenCalledWith(
      '/api/v1/orders/PY-2026-000001/shipping/',
      { shipping_method_id: 3 },
    );
    const state = store.getState().orders;
    expect(state.lastAction).toBe('shipping_updated');
  });

  it('propaga error tipado (400 METODO_NO_EDITABLE)', async () => {
    const err = new APIError('Metodo no editable', 'VALIDATION', 400);
    apiService.patch.mockRejectedValue(err);

    const store = makeStore();
    await store.dispatch(updateOrderShipping({
      orderNumber:      'PY-2026-000001',
      shippingMethodId: 3,
    }));
    const state = store.getState().orders;
    expect(state.actionError).toMatchObject({
      code:       'VALIDATION',
      statusCode: 400,
    });
  });
});
