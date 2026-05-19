/**
 * useAddresses — hook React Query.
 * UC-AUTH-07: lista de direcciones de envio del comprador autenticado.
 */
import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

const ADDRESSES_URL = '/api/v1/auth/addresses/';

export const ADDRESSES_KEY = ['addresses'];

export function useAddresses(options = {}) {
  return useQuery({
    queryKey: ADDRESSES_KEY,
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(ADDRESSES_URL, { signal });
      const results = data?.results ?? data ?? [];
      return Array.isArray(results) ? results : [];
    },
    ...options,
  });
}

export default useAddresses;
