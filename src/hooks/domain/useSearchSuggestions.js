/**
 * useSearchSuggestions — autocomplete con sugerencias en vivo (UC-SRCH-02).
 *
 * Consulta sugerencias de busqueda mientras el usuario escribe. Aplica un
 * debounce (~250ms) sobre el termino y exige un minimo de 2 caracteres para
 * evitar una peticion por cada tecla. Por debajo del minimo la query de
 * React Query queda deshabilitada (sin red ni cache sucia). React Query
 * cancela las peticiones obsoletas al cambiar la queryKey.
 *
 * Endpoint (AutocompleteView, permission_classes=[AllowAny]):
 *   GET /api/v1/catalogue/autocomplete/?q=<term>
 *     -> [ { id, name, slug }, ... ]   (array de productos)
 *
 * El backend devuelve objetos de producto; este hook extrae el `name` para
 * alimentar el SearchBar / Autocomplete, que trabajan con strings.
 *
 * Retorna `{ suggestions, isLoading }`.
 */
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

export const SUGGESTIONS_URL = '/api/v1/catalogue/autocomplete/';
export const SUGGESTIONS_KEY = ['catalog', 'search', 'autocomplete'];

const MIN_LENGTH  = 2;
const DEBOUNCE_MS = 250;

export function normalizeQuery(raw) {
  if (typeof raw !== 'string') return '';
  return raw.trim().replace(/\s+/g, ' ');
}

export function useSearchSuggestions(rawQuery = '', options = {}) {
  const normalized = normalizeQuery(rawQuery);

  // Debounce: solo promovemos el termino al estado consultado tras la pausa.
  // Arranca vacio para que ningun termino se consulte antes del primer
  // intervalo de debounce (incluido el valor inicial del input).
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebounced(normalized), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [normalized]);

  const enabled =
    (options.enabled ?? true) && debounced.length >= MIN_LENGTH;

  const query = useQuery({
    queryKey: [...SUGGESTIONS_KEY, debounced],
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(SUGGESTIONS_URL, {
        params: { q: debounced },
        signal,
      });
      // AutocompleteView devuelve un array de productos {id, name, slug}.
      // El SearchBar consume strings, asi que extraemos `name`.
      const list = Array.isArray(data)
        ? data
        : (data?.results ?? data?.suggestions ?? []);
      return list
        .map((item) => (typeof item === 'string' ? item : item?.name))
        .filter(Boolean);
    },
    enabled,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  return {
    suggestions: query.data ?? [],
    isLoading:   enabled && query.isFetching,
  };
}

export default useSearchSuggestions;
