/**
 * useInventory / useInventoryMovements — hooks de React Query.
 *
 *   UC-INV-01 — Listado de stock con filtros
 *   UC-INV-02/03 — Historial de movimientos por variante
 */

import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

const STOCK_URL = '/api/v1/admin/inventory/';
const MOVEMENTS = (variantId) =>
  `/api/v1/admin/inventory/variants/${variantId}/movements/`;

export const INVENTORY_KEY           = ['inventory'];
export const INVENTORY_MOVEMENTS_KEY = ['inventory', 'movements'];

export function useInventory(params = {}) {
  return useQuery({
    queryKey: [...INVENTORY_KEY, params],
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(STOCK_URL, { params, signal });
      return data ?? {};
    },
  });
}

export function useInventoryMovements(variantId) {
  return useQuery({
    queryKey: [...INVENTORY_MOVEMENTS_KEY, variantId],
    enabled:  Boolean(variantId),
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(MOVEMENTS(variantId), { signal });
      return data?.results ?? data?.movements ?? data ?? [];
    },
  });
}

export default useInventory;
