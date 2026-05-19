/**
 * useYorubaVariants / useAdminProductVariants — hooks React Query.
 *
 * Familia Yoruba (CHARTSIZE):
 *   UC-CHT-01 — Variantes del producto (publico): se sirve via useProduct
 *               (ProductPage) que ya consume el detalle del catalogo y
 *               recibe el campo `variants` cuando la API lo expone.
 *   UC-CHT-03 — Variantes del producto en el panel admin.
 *
 * Las mutaciones (crear, activar/desactivar, fijar precio) siguen en el
 * slice `yorubaVariantsSlice` para preservar lastAction; estos hooks
 * cubren solo las lecturas con cache compartido entre montajes.
 */
import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

const ADMIN_VARIANTS_URL = (productId) =>
  `/api/v1/admin/products/${productId}/variants/`;

export const YORUBA_VARIANTS_KEY = ['yoruba-variants'];

/**
 * Lista las variantes administrables de un producto. UC-CHT-03.
 *
 * @param {number|string} productId
 */
export function useAdminProductVariants(productId) {
  return useQuery({
    queryKey: [...YORUBA_VARIANTS_KEY, 'admin', productId],
    enabled:  Boolean(productId),
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(
        ADMIN_VARIANTS_URL(productId),
        { signal },
      );
      // El backend puede devolver `{ results }` o el array plano.
      return data?.results ?? data?.variantes ?? data ?? [];
    },
  });
}

export default useAdminProductVariants;
