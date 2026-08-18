/**
 * API Service - PracticaYoruba
 *
 * Maneja todas las llamadas REST al backend Django con:
 *   - Errores tipados (apiErrors.js)
 *   - Retry automatico en errores transitorios
 *   - Timeout con AbortController
 *   - Interceptores de request/response
 *   - Mock-first via mockInterceptor (PY_*_SOURCE=mock)
 *   - Auth por SESION de servidor (ADR-018): la cookie HttpOnly viaja
 *     sola con credentials:'same-origin'. NO hay tokens JWT ni token
 *     CSRF en memoria — la sesion sobrevive a la recarga y la defensa
 *     CSRF es SameSite=Lax + __Host- de la cookie de sesion: Lax no
 *     viaja en un POST cross-site, y toda mutacion aqui es XHR. NO es
 *     Strict — ver CR-5 en api/src/config/settings/production.py:18.
 *   - 401 = sesion ausente/expirada -> dispatch 'py:unauthorized'
 *     (UnauthorizedListener cierra el estado y avisa al usuario).
 */

import {
  TimeoutError,
  NetworkError,
  createErrorFromResponse,
} from '@utils/apiErrors';

// T-302 (H-07): conditional require keeps mock modules OUT of
// production bundles. Webpack replaces process.env.NODE_ENV with
// the literal at build time; the false branch is dead-code-
// eliminated, so @mocks/mockInterceptor is never bundled in prod.
// Using !== 'production' (not === 'development') so that
// jest.mock('@mocks/mockInterceptor') still intercepts correctly
// when NODE_ENV='test'.
const mockInterceptor =
  process.env.NODE_ENV !== 'production'
    ? require('@mocks/mockInterceptor').default
    : { intercept: async () => null };

const DEFAULT_TIMEOUT        = 30_000;
const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY    = 1_000;

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

// Reintentar automaticamente solo es seguro en metodos idempotentes (RFC 9110
// 9.2.2). Un POST/PATCH que fallo con 5xx o corte de red pudo haberse aplicado
// en el servidor antes de perder la respuesta: repetirlo duplica el efecto. En
// este contrato el caso concreto es el cobro L0
// (POST /api/v2/platform/invoices/<id>/retry/), donde un reintento ciego es un
// cargo duplicado — y no existe clave de idempotencia que lo neutralice. El
// reintento de una mutacion es decision del usuario (boton "Reintentar"), no
// del transporte.
const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE']);

class APIService {
  constructor(baseURL = '', options = {}) {
    this.baseURL       = baseURL || process.env.API_URL || '';
    this.timeout       = options.timeout       ?? DEFAULT_TIMEOUT;
    this.retryAttempts = options.retryAttempts ?? DEFAULT_RETRY_ATTEMPTS;
    this.retryDelay    = options.retryDelay    ?? DEFAULT_RETRY_DELAY;
    this.headers       = {
      'Content-Type': 'application/json',
      'Accept':       'application/json',
      ...options.headers,
    };
    this._interceptors  = { request: [], response: [], error: [] };
    // ADR-018 (migracion a sesion): la auth del web es la cookie de sesion
    // HttpOnly, que el navegador manda sola (credentials:'same-origin'). No
    // hay tokens JWT ni token CSRF en memoria: la sesion sobrevive a la
    // recarga y la defensa CSRF es SameSite=Lax + __Host- de la cookie.
    // DEC-BC-07: X-Cart-Token para sesion anonima de carrito (memory-only,
    // XSS-safe, se pierde al cerrar tab — aceptable para comprador anonimo).
    this._cartToken     = null;
  }

  // DEC-BC-07: X-Cart-Token management. Propaga sesion anonima del
  // carrito cross-request. Backend setea header en response;
  // siguientes requests a /api/v2/cart/ envian el token.
  setCartToken(token) {
    this._cartToken = token || null;
  }

  getCartToken() {
    return this._cartToken;
  }

  clearCartToken() {
    this._cartToken = null;
  }

  addRequestInterceptor(fn)  { this._interceptors.request.push(fn); }
  addResponseInterceptor(fn) { this._interceptors.response.push(fn); }
  addErrorInterceptor(fn)    { this._interceptors.error.push(fn); }

  async _request(method, path, options = {}, attempt = 1) {
    const { body, params, timeout = this.timeout, headers = {} } = options;

    // Con baseURL absoluto (prod / API_URL fijado) la URL es absoluta. Con
    // baseURL relativo/vacío (dev por proxy) se resuelve contra el ORIGEN
    // actual → misma-origin → el devServer.proxy reenvía /api a :8000 y la
    // cookie de sesión viaja. Sin esto, `new URL('/api/…')` lanzaría (una URL
    // relativa necesita base). Necesario para el E2E con backend real
    // (SOL-081): sin mocks, el fetch cross-origin perdería la cookie.
    const base = this.baseURL
      || (typeof window !== 'undefined' && window.location
        ? window.location.origin
        : 'http://localhost');
    const url = new URL(path.startsWith('http') ? path : `${base}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v === null || v === undefined) return;
        // Un arreglo se serializa como parametro repetible
        // (?k=a&k=b) — lo que Django lee con getlist() — en vez de
        // unirse con comas. Soporta el filtro multi-categoria (T-11).
        if (Array.isArray(v)) {
          v.forEach((item) => {
            if (item !== null && item !== undefined && item !== '') {
              url.searchParams.append(k, item);
            }
          });
        } else {
          url.searchParams.set(k, v);
        }
      });
    }

    // Intentar mock interceptor primero
    const mockResult = await mockInterceptor.intercept(url.toString(), {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: { ...this.headers, ...headers },
    });

    if (mockResult !== null) {
      if (mockResult.status >= 400) {
        const err = new Error(mockResult.data?.detail || `HTTP ${mockResult.status}`);
        err.status = mockResult.status;
        err.body   = mockResult.data;
        throw err;
      }
      return { data: mockResult.data, status: mockResult.status };
    }

    // Request real al backend
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    let config = { method, url: url.toString(), headers: { ...this.headers, ...headers } };
    if (isFormData) {
      // Dejar que fetch establezca Content-Type con el boundary correcto.
      delete config.headers['Content-Type'];
    }
    // DEC-BC-07: si hay _cartToken activo, propagarlo en requests a
    // /api/v2/cart/ para mantener la sesion anonima cross-request.
    if (this._cartToken && path.includes('/api/v2/cart/')) {
      config.headers['X-Cart-Token'] = this._cartToken;
    }
    for (const fn of this._interceptors.request) {
      config = (await fn(config)) ?? config;
    }

    const controller = new AbortController();
    const timerId    = setTimeout(() => controller.abort(), timeout);

    let response;
    try {
      response = await fetch(config.url, {
        method:      config.method,
        headers:     config.headers,
        body:        body ? (isFormData ? body : JSON.stringify(body)) : undefined,
        // ADR-018 (DEC-STF-AUTH-COOKIE): la cookie de sesion HttpOnly viaja
        // con la peticion (mismo origin en dev via proxy y en prod mismo
        // dominio). Restaura la sesion tras recargar sin el JWT en memoria.
        credentials: 'same-origin',
        signal:      controller.signal,
      });
    } catch (err) {
      clearTimeout(timerId);
      if (err.name === 'AbortError') throw new TimeoutError(timeout);
      if (this._canRetry(method, attempt)) {
        await this._delay(this.retryDelay * attempt);
        return this._request(method, path, options, attempt + 1);
      }
      throw new NetworkError(err.message, err);
    } finally {
      clearTimeout(timerId);
    }

    if (!response.ok) {
      if (RETRYABLE_STATUS.has(response.status) && this._canRetry(method, attempt)) {
        await this._delay(this.retryDelay * attempt);
        return this._request(method, path, options, attempt + 1);
      }

      let errorBody = {};
      try { errorBody = await response.json(); } catch { /* respuesta sin JSON: errorBody queda {} */ }

      if (response.status === 401) {
        // ADR-018: la auth es la cookie de sesion; no hay refresh en memoria
        // que reintentar. Un 401 significa sesion ausente o expirada -> se
        // notifica a la app para cerrar el estado de auth y avisar al usuario
        // (UnauthorizedListener muestra el aviso de sesion expirada).
        window.dispatchEvent(new CustomEvent('py:unauthorized'));
      }

      const error = createErrorFromResponse({ status: response.status, data: errorBody });
      for (const fn of this._interceptors.error) await fn(error);
      throw error;
    }

    let data = null;
    if (response.status !== 204) {
      try { data = await response.json(); } catch { /* respuesta sin JSON: data queda null */ }
    }

    // DEC-BC-07: si el backend devuelve X-Cart-Token (sesion anonima
    // recien creada o rotada), guardarlo para siguientes requests.
    const cartTokenHeader = response.headers.get('X-Cart-Token');
    if (cartTokenHeader) {
      this._cartToken = cartTokenHeader;
    }

    let result = { data, status: response.status, headers: response.headers };
    for (const fn of this._interceptors.response) {
      result = (await fn(result)) ?? result;
    }

    return result;
  }

  _delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  // Un reintento requiere presupuesto de intentos Y un metodo idempotente.
  _canRetry(method, attempt) {
    return attempt < this.retryAttempts && IDEMPOTENT_METHODS.has(method);
  }

  get(path, options)         { return this._request('GET',    path, options); }
  post(path, body, options)  { return this._request('POST',   path, { ...options, body }); }
  put(path, body, options)   { return this._request('PUT',    path, { ...options, body }); }
  patch(path, body, options) { return this._request('PATCH',  path, { ...options, body }); }
  delete(path, options)      { return this._request('DELETE', path, options); }
}

const apiService = new APIService();
export default apiService;
export { APIService };

export function getMpPublicKey() {
  return apiService.get('/api/v2/payments/public-key/');
}

export function getPaymentMethods() {
  return apiService.get('/api/v2/payments/methods/');
}

export function getMpCustomer() {
  return apiService.get('/api/v2/payments/customer/');
}

export function getCustomerCards() {
  return apiService.get('/api/v2/payments/cards/');
}

export function saveCustomerCard(token) {
  return apiService.post('/api/v2/payments/cards/', { token });
}

export function validateCard(token, paymentMethodId) {
  return apiService.post('/api/v2/payments/cards/validate/', {
    token,
    payment_method_id: paymentMethodId,
  });
}

export function getCustomerCard(cardId) {
  return apiService.get(`/api/v2/payments/cards/${cardId}/`);
}

export function updateCustomerCard(cardId, data) {
  return apiService.put(`/api/v2/payments/cards/${cardId}/`, data);
}

export function deleteCustomerCard(cardId) {
  return apiService.delete(`/api/v2/payments/cards/${cardId}/`);
}

// T-214 (party migration, UI): lookup SEPOMEX publico por C.P. (AllowAny,
// api@8921e37). 200 -> {postal_code,country,state,municipality,city,
// settlements:[{settlement_name,settlement_type}]}; 404 -> {codigo_error:
// 'POSTAL_CODE_NOT_FOUND'}. apiService._request lanza en !response.ok, asi que
// un 404 se propaga como excepcion (createErrorFromResponse) — el hook
// consumidor (useCpAutocomplete) lo captura y degrada a modo manual.
export function getPostalCode(cp, country = 'MX') {
  return apiService.get(`/api/v2/geo/postal-codes/${cp}/`, { params: { country } });
}

// DEC-08/09 (party/authz, api@c359164): menú admin dinámico podado por las
// capacidades del usuario. Árbol [{key,label,route,icon,order,capability,
// children:[...]}]. El candado real sigue siendo el backend; el menú es
// proyección UX. me/capabilities devuelve {is_superadmin, capabilities:[...]}.
export function getAdminMenu() {
  return apiService.get('/api/v2/authz/me/menu/').then((r) => r.data);
}

// DEC-AUTHZ-BUYER: menú de cuenta del comprador, mismo endpoint podado por
// capacidades pero audience='account' (registro-dirigido; agregar un ítem es
// sembrar una fila, sin tocar el UI).
export function getAccountMenu() {
  return apiService
    .get('/api/v2/authz/me/menu/', { params: { audience: 'account' } })
    .then((r) => r.data);
}

export function getMyCapabilities() {
  return apiService.get('/api/v2/authz/me/capabilities/').then((r) => r.data);
}
