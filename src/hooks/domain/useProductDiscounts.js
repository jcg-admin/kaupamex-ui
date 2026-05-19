/**
 * useProductDiscounts — hook de React Query para listar descuentos de producto.
 *
 * UC-DASH-04: lista de ProductDiscount con is_active=True clasificados por
 * estado de vigencia (CURRENT / FUTURE / EXPIRED).
 *
 * Las mutaciones (crear, editar, desactivar) pasan por el slice
 * `productDiscountsSlice` porque comparten `lastAction` / `isActioning`.
 * Tras una mutacion exitosa se debe invalidar `['product-discounts']`
 * para sincronizar el cache.
 */

import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

const PRODUCT_DISCOUNTS_URL = '/api/v1/admin/product-discounts/';

export const PRODUCT_DISCOUNTS_QUERY_KEY = ['product-discounts'];

export function useProductDiscounts(params = {}) {
  return useQuery({
    queryKey: [...PRODUCT_DISCOUNTS_QUERY_KEY, params],
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(PRODUCT_DISCOUNTS_URL, {
        params,
        signal,
      });
      return data?.results ?? data ?? [];
    },
  });
}

export default useProductDiscounts;
