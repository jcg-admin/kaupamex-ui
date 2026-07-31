/**
 * useCpAutocomplete — autocompletado de C.P. mexicano (T-214, party migration).
 *
 * Progressive enhancement sobre los formularios de direccion: mientras el
 * comprador escribe el C.P., tras un debounce y solo con exactamente 5
 * digitos, consulta el lookup publico SEPOMEX y ofrece municipio/estado +
 * la lista de colonias del C.P. La captura manual SIEMPRE sigue funcionando
 * (graceful degradation) — un 404 o un error de red nunca bloquean el
 * formulario, solo dejan de ofrecer el autocompletado.
 *
 * Endpoint (GeoPostalCodeView, permission_classes=[AllowAny], api@8921e37):
 *   GET /api/v2/geo/postal-codes/<cp>/?country=MX
 *     -> 200 {postal_code, country, state, municipality, city,
 *             settlements: [{settlement_name, settlement_type}, ...]}
 *     -> 404 {codigo_error: 'POSTAL_CODE_NOT_FOUND', detail}
 *
 * Retorna `{ loading, error, notFound, data }`:
 *   - `data`     — el body del lookup, o null si no hay match/aun no se
 *                  consulto.
 *   - `notFound` — true si el CP no existe en el catalogo (404). El
 *                  consumidor debe tratarlo como "sin match", no como error
 *                  bloqueante.
 *   - `error`    — cualquier OTRO fallo (red, 5xx). Tampoco bloquea al
 *                  consumidor; solo se expone para diagnostico/telemetria.
 *   - `loading`  — true mientras la consulta esta en vuelo.
 */
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

export const CP_LOOKUP_URL = '/api/v2/geo/postal-codes';
export const CP_LOOKUP_KEY = ['geo', 'postal-code'];

const CP_LENGTH    = 5;
const DEBOUNCE_MS  = 300;
// canon-idioma: codigo_error real del endpoint GeoPostalCodeView (contrato externo, api@8921e37) — no un identifier propio del UI.
const CP_NOT_FOUND_CODE = 'POSTAL_CODE_NOT_FOUND';

export function normalizeCp(raw) {
  if (typeof raw !== 'string') return '';
  return raw.replace(/\D/g, '').slice(0, CP_LENGTH);
}

export function useCpAutocomplete(rawCp = '', options = {}) {
  const country = options.country || 'MX';
  const cp = normalizeCp(rawCp);

  // Debounce: solo se promueve el C.P. al estado consultado tras la pausa,
  // igual patron que useSearchSuggestions (UC-SRCH-02).
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebounced(cp), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [cp]);

  const enabled =
    (options.enabled ?? true) && debounced.length === CP_LENGTH;

  const query = useQuery({
    queryKey: [...CP_LOOKUP_KEY, debounced, country],
    queryFn: async ({ signal }) => {
      const { data } = await apiService.get(`${CP_LOOKUP_URL}/${debounced}/`, {
        params: { country },
        signal,
      });
      return data;
    },
    enabled,
    retry: false,
    staleTime: 5 * 60_000, // un C.P. no cambia de colonias durante la sesion
  });

  // Un 404 (POSTAL_CODE_NOT_FOUND) es un resultado valido de "sin match" — no un
  // error que deba mostrarse como fallo del formulario (graceful
  // degradation: la captura manual sigue disponible).
  const notFound = query.error?.statusCode === 404
    || query.error?.code === CP_NOT_FOUND_CODE
    || query.error?.codigo_error === CP_NOT_FOUND_CODE;

  return {
    loading:  enabled && query.isFetching,
    error:    notFound ? null : (query.error || null),
    notFound,
    data:     notFound ? null : (query.data ?? null),
  };
}

export default useCpAutocomplete;
