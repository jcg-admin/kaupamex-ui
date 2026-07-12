import { http, HttpResponse } from 'msw';

const BASE = process.env.API_URL || 'http://localhost:8000';

// T-214 (party migration): lookup publico SEPOMEX por C.P. (AllowAny,
// api@8921e37). Handler base: CP no encontrado (404) — evita que tests que
// NO ejercitan el autocompletado disparen una llamada real a la red cuando
// el debounce (300ms) de useCpAutocomplete vence durante awaits/waitFor
// ajenos a esta feature. Los tests que SI ejercitan el autocompletado
// sobreescriben esta ruta con server.use(...) (los overrides de runtime
// siempre tienen prioridad sobre los handlers base de setupServer).
export const geoHandlers = [
  http.get(`${BASE}/api/v2/geo/postal-codes/:cp/`, () =>
    HttpResponse.json(
      // canon-idioma: refleja el codigo_error real del api (contrato externo, api@8921e37), no un identifier propio del mock.
      { codigo_error: 'CP_NO_ENCONTRADO', detail: 'Código postal no encontrado.' },
      { status: 404 },
    ),
  ),
];
