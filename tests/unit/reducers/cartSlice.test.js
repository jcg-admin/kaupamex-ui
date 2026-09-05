/**
 * Tests — cartSlice reducer
 * Kaupamex UI
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

    it('fulfilled — debe actualizar items y totales desde el payload (backend Cart shape)', () => {
      // DEC-BC-02 + DEC-BC-08: backend devuelve Cart completo con
      // totals. UI NO recalcula localmente.
      const cartPayload = {
        items:   [ITEM_A, ITEM_B],
        voucher: null,
        totals: {
          subtotal:     '880.00',
          discount:     '0.00',
          subtotal_net: '880.00',
          tax_included: '121.38',
          total:        '880.00',
        },
      };
      const action = { type: addToCart.fulfilled.type, payload: cartPayload };
      const next   = cartReducer(INITIAL_STATE, action);

      expect(next.items).toHaveLength(2);
      // 350*2 + 180*1 = 880 subtotal (del backend, no recalculado)
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
    it('fulfilled — debe reemplazar el carrito con el Cart shape del backend', () => {
      // DEC-BC-08: backend DELETE /cart/items/<id>/ devuelve Cart
      // actualizado (200). El reducer usa setCart, no filter local.
      const state = {
        ...INITIAL_STATE,
        items: [ITEM_A, ITEM_B],
        itemCount: 3,
      };
      const cartPayload = {
        items:   [ITEM_B],  // backend ya removio ITEM_A
        voucher: null,
        totals: {
          subtotal:     '180.00',
          discount:     '0.00',
          subtotal_net: '180.00',
          tax_included: '24.83',
          total:        '180.00',
        },
      };
      const action = { type: removeCartItem.fulfilled.type, payload: cartPayload };
      const next   = cartReducer(state, action);

      expect(next.items).toHaveLength(1);
      expect(next.items[0].id).toBe(2);
      expect(next.totals.subtotal).toBe(180);
    });
  });

  describe('applyVoucher thunk', () => {
    it('fulfilled — debe aplicar el voucher con totals computed by backend', () => {
      // DEC-BC-02: backend computa los totals con DEC-BC-05 IVA incluido.
      // subtotal 700, voucher 10% -> discount 70, subtotal_net 630.
      // IVA incluido: tax = subtotal_net * 0.16 / 1.16 = 86.90.
      // total = subtotal_net (sin sumar IVA porque IVA esta incluido).
      const voucher = { code: 'YORUBA10', type: 'PERCENT', value: 10 };
      const cartPayload = {
        items:   [ITEM_A],   // 350 * 2 = 700 subtotal
        voucher,
        totals: {
          subtotal:     '700.00',
          discount:     '70.00',
          subtotal_net: '630.00',
          tax_included: '86.90',
          total:        '630.00',
        },
      };
      const action = { type: applyVoucher.fulfilled.type, payload: cartPayload };
      const next   = cartReducer(INITIAL_STATE, action);

      expect(next.voucher).toEqual(voucher);
      expect(next.totals.discount).toBeCloseTo(70);
      expect(next.totals.tax).toBeCloseTo(86.90);
      expect(next.totals.total).toBeCloseTo(630);
    });

    it('rejected — debe guardar el error de voucher inválido en actionError', () => {
      const action = { type: applyVoucher.rejected.type, payload: 'Voucher expirado' };
      const next   = cartReducer(INITIAL_STATE, action);
      expect(next.actionError).toBe('Voucher expirado');
    });
  });
});
