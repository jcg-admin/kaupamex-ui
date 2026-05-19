/**
 * Tests — cartSlice reducer
 * PracticaYoruba UI
 */

import cartReducer, {
  clearCart,
  addToCart,
  removeCartItem,
  applyVoucher,
} from '../../../src/redux/slices/cartSlice';

const INITIAL_STATE = {
  items: [],
  voucher: null,
  totals: { subtotal: 0, discount: 0, tax: 0, total: 0 },
  itemCount: 0,
  isLoading: false,
  error: null,
  isActioning: false,
  actionError: null,
  lastAction: null,
};

const ITEM_A = { id: 1, product_id: 10, name: 'Collar Oshun', price: 350, quantity: 2 };
const ITEM_B = { id: 2, product_id: 20, name: 'Pulsera Elegua', price: 180, quantity: 1 };

describe('cartSlice', () => {
  describe('estado inicial', () => {
    it('debe devolver el estado inicial', () => {
      expect(cartReducer(undefined, { type: '@@INIT' })).toEqual(INITIAL_STATE);
    });
  });

  describe('clearCart', () => {
    it('debe vaciar el carrito', () => {
      const state = {
        ...INITIAL_STATE,
        items: [ITEM_A],
        itemCount: 2,
        totals: { subtotal: 700, discount: 0, tax: 112, total: 812 },
      };
      const next = cartReducer(state, clearCart());
      expect(next.items).toHaveLength(0);
      expect(next.itemCount).toBe(0);
      expect(next.totals.total).toBe(0);
    });
  });

  describe('addToCart thunk', () => {
    it('pending — debe poner isLoading en true', () => {
      const action = { type: addToCart.pending.type };
      const next   = cartReducer(INITIAL_STATE, action);
      expect(next.isLoading).toBe(true);
    });

    it('fulfilled — debe actualizar items y totales desde el payload', () => {
      const cartPayload = {
        items:   [ITEM_A, ITEM_B],
        voucher: null,
      };
      const action = { type: addToCart.fulfilled.type, payload: cartPayload };
      const next   = cartReducer(INITIAL_STATE, action);

      expect(next.items).toHaveLength(2);
      // 350*2 + 180*1 = 880 subtotal
      expect(next.totals.subtotal).toBe(880);
      expect(next.itemCount).toBe(3); // 2 + 1
      expect(next.isLoading).toBe(false);
    });

    it('rejected — debe guardar el error', () => {
      const action = { type: addToCart.rejected.type, payload: 'Sin stock' };
      const next   = cartReducer(INITIAL_STATE, action);
      expect(next.error).toBe('Sin stock');
      expect(next.isLoading).toBe(false);
    });
  });

  describe('removeCartItem thunk', () => {
    it('fulfilled — debe eliminar el item por id', () => {
      const state = {
        ...INITIAL_STATE,
        items: [ITEM_A, ITEM_B],
        itemCount: 3,
      };
      const action = { type: removeCartItem.fulfilled.type, payload: 1 };
      const next   = cartReducer(state, action);

      expect(next.items).toHaveLength(1);
      expect(next.items[0].id).toBe(2);
    });
  });

  describe('applyVoucher thunk', () => {
    it('fulfilled — debe aplicar el voucher y recalcular totales', () => {
      const voucher = { code: 'YORUBA10', type: 'PERCENT', value: 10 };
      const cartPayload = {
        items:   [ITEM_A],   // 350 * 2 = 700 subtotal
        voucher,
      };
      const action = { type: applyVoucher.fulfilled.type, payload: cartPayload };
      const next   = cartReducer(INITIAL_STATE, action);

      expect(next.voucher).toEqual(voucher);
      // Descuento = 700 * 10% = 70
      expect(next.totals.discount).toBeCloseTo(70);
      // Taxable = 630, IVA = 100.8
      expect(next.totals.tax).toBeCloseTo(100.8);
      expect(next.totals.total).toBeCloseTo(730.8);
    });

    it('rejected — debe guardar el error de voucher inválido en actionError', () => {
      const action = { type: applyVoucher.rejected.type, payload: 'Voucher expirado' };
      const next   = cartReducer(INITIAL_STATE, action);
      expect(next.actionError).toBe('Voucher expirado');
    });
  });
});
