/**
 * useCart — PracticaYoruba
 * Hook del carrito de compras.
 */

import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import {
  selectCartItems, selectCartItemCount, selectCartTotals,
  selectCartVoucher, selectCartLoading, selectCartError, selectIsCartEmpty,
} from '@redux/selectors';
import {
  fetchCart, addToCart, updateCartItem,
  removeCartItem, applyVoucher, removeVoucher, clearCart,
} from '@redux/slices/cartSlice';
import { useToast } from '@context/ToastContext';

export function useCart() {
  const dispatch  = useDispatch();
  const { success, error: toastError } = useToast();

  const items     = useSelector(selectCartItems);
  const count     = useSelector(selectCartItemCount);
  const totals    = useSelector(selectCartTotals);
  const voucher   = useSelector(selectCartVoucher);
  const isLoading = useSelector(selectCartLoading);
  const error     = useSelector(selectCartError);
  const isEmpty   = useSelector(selectIsCartEmpty);

  const fetch = useCallback(() => dispatch(fetchCart()), [dispatch]);

  const add = useCallback(async (productId, variantId, quantity = 1) => {
    const result = await dispatch(addToCart({ productId, variantId, quantity }));
    if (addToCart.fulfilled.match(result)) {
      success('Añadido al carrito', '');
    } else {
      toastError('No se pudo añadir', result.payload);
    }
    return result;
  }, [dispatch, success, toastError]);

  const update = useCallback((itemId, quantity) =>
    dispatch(updateCartItem({ itemId, quantity })), [dispatch]);

  const remove = useCallback((itemId) =>
    dispatch(removeCartItem(itemId)), [dispatch]);

  const applyCode = useCallback(async (code) => {
    const result = await dispatch(applyVoucher(code));
    if (applyVoucher.fulfilled.match(result)) {
      success('Voucher aplicado', '');
    } else {
      toastError('Voucher inválido', result.payload);
    }
    return result;
  }, [dispatch, success, toastError]);

  const removeCode = useCallback(() => dispatch(removeVoucher()), [dispatch]);
  const clear      = useCallback(() => dispatch(clearCart()),     [dispatch]);

  return {
    items, count, totals, voucher, isLoading, error, isEmpty,
    fetch, add, update, remove, applyCode, removeCode, clear,
  };
}
