/**
 * Tests — vouchersSlice reducer
 * UC-PRO-01: Crear Voucher (Admin)
 * UC-PRO-02: Editar Voucher (Admin)
 * UC-PRO-03: Desactivar Voucher (Admin)
 */

import vouchersReducer, {
  clearVoucherActionState,
  fetchVouchers,
  createVoucher,
  deactivateVoucher,
} from '../../../src/redux/slices/vouchersSlice';

const INITIAL_STATE = {
  items: [],
  isLoading: false,
  isActioning: false,
  error: null,
  actionError: null,
  lastAction: null,
};

const VOUCHER_A = {
  id: 1,
  code: 'WELCOME10',
  type: 'PERCENT',
  value: 10,
  max_uses: 100,
  is_active: true,
};

const VOUCHER_B = {
  id: 2,
  code: 'FIXED50',
  type: 'FIXED',
  value: 50,
  max_uses: null,
  is_active: true,
};

describe('vouchersSlice', () => {
  describe('estado inicial', () => {
    it('debe devolver el estado inicial', () => {
      expect(vouchersReducer(undefined, { type: '@@INIT' })).toEqual(INITIAL_STATE);
    });
  });

  describe('clearVoucherActionState', () => {
    it('debe limpiar actionError y lastAction', () => {
      const state = {
        ...INITIAL_STATE,
        actionError: 'boom',
        lastAction: 'created',
      };
      const next = vouchersReducer(state, clearVoucherActionState());
      expect(next.actionError).toBeNull();
      expect(next.lastAction).toBeNull();
    });
  });

  describe('fetchVouchers thunk', () => {
    it('pending — debe poner isLoading en true', () => {
      const next = vouchersReducer(INITIAL_STATE, { type: fetchVouchers.pending.type });
      expect(next.isLoading).toBe(true);
      expect(next.error).toBeNull();
    });

    it('fulfilled — debe poblar items con la lista', () => {
      const next = vouchersReducer(INITIAL_STATE, {
        type: fetchVouchers.fulfilled.type,
        payload: { results: [VOUCHER_A, VOUCHER_B] },
      });
      expect(next.items).toHaveLength(2);
      expect(next.items[0].code).toBe('WELCOME10');
      expect(next.isLoading).toBe(false);
    });

    it('rejected — debe registrar el error', () => {
      const next = vouchersReducer(INITIAL_STATE, {
        type: fetchVouchers.rejected.type,
        payload: 'Network error',
      });
      expect(next.isLoading).toBe(false);
      expect(next.error).toBe('Network error');
    });
  });

  describe('createVoucher thunk (UC-PRO-01)', () => {
    it('fulfilled — debe agregar el voucher al inicio y marcar lastAction', () => {
      const state = { ...INITIAL_STATE, items: [VOUCHER_B] };
      const next  = vouchersReducer(state, {
        type: createVoucher.fulfilled.type,
        payload: VOUCHER_A,
      });
      expect(next.items[0].code).toBe('WELCOME10');
      expect(next.items).toHaveLength(2);
      expect(next.lastAction).toBe('created');
      expect(next.isActioning).toBe(false);
    });

    it('rejected — debe guardar actionError', () => {
      const next = vouchersReducer(INITIAL_STATE, {
        type: createVoucher.rejected.type,
        payload: 'Codigo duplicado',
      });
      expect(next.actionError).toBe('Codigo duplicado');
      expect(next.isActioning).toBe(false);
    });
  });

  describe('deactivateVoucher thunk (UC-PRO-03)', () => {
    it('fulfilled — debe marcar el voucher como inactivo', () => {
      const state = { ...INITIAL_STATE, items: [VOUCHER_A, VOUCHER_B] };
      const next  = vouchersReducer(state, {
        type: deactivateVoucher.fulfilled.type,
        payload: { ...VOUCHER_A, is_active: false },
      });
      const updated = next.items.find((v) => v.id === VOUCHER_A.id);
      expect(updated.is_active).toBe(false);
      expect(next.lastAction).toBe('deactivated');
    });
  });
});
