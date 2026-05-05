/**
 * queryClient — PracticaYoruba
 * Configuración de React Query para el e-commerce
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:          60_000,   // 1 minuto
      gcTime:             5 * 60_000, // 5 minutos
      retry:              2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
