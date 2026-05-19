/**
 * Tests — ordersSlice.updateOrderAddress (UC-ORD-05 — editar direccion)
 */
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

import apiService from '@services/apiService';
import ordersReducer, { updateOrderAddress } from '@redux/slices/ordersSlice';
import { APIError } from '@utils/apiErrors';

const makeStore = () =>
  configureStore({ reducer: { orders: ordersReducer } });

const ADDRESS = {
  recipient_name: 'Juana Perez',
  street:         'Av. Reforma 123',
  city:           'CDMX',
  state:          'CDMX',
  zip_code:       '06600',
  country:        'MX',
  phone:          '+525511112222',
};

afterEach(() => jest.clearAllMocks());

describe('ordersSlice — updateOrderAddress (UC-ORD-05)', () => {
  it('llama PATCH /api/v1/orders/:order_number/address/ con la nueva direccion', async () => {
    apiService.patch.mockResolvedValue({
      data: { order_number: 'PY-2026-000001', address: ADDRESS },
    });
    const store = makeStore();
    await store.dispatch(updateOrderAddress({
      orderNumber: 'PY-2026-000001',
      address:     ADDRESS,
    }));
    expect(apiService.patch).toHaveBeenCalledWith(
      '/api/v1/orders/PY-2026-000001/address/',
      ADDRESS,
    );
    const state = store.getState().orders;
    expect(state.lastAction).toBe('address_updated');
  });

  it('propaga error tipado (400 DIRECCION_NO_EDITABLE)', async () => {
    const err = new APIError('Direccion no editable', 'VALIDATION', 400);
    apiService.patch.mockRejectedValue(err);

    const store = makeStore();
    await store.dispatch(updateOrderAddress({
      orderNumber: 'PY-2026-000001',
      address:     ADDRESS,
    }));
    const state = store.getState().orders;
    expect(state.actionError).toMatchObject({
      code:       'VALIDATION',
      statusCode: 400,
    });
  });
});
