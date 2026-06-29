/**
 * API Service - PracticaYoruba
 *
 * Maneja todas las llamadas REST al backend Django con:
 *   - Errores tipados (apiErrors.js)
 *   - Retry automatico en errores transitorios
 *   - Timeout con AbortController
 *   - Interceptores de request/response
 *   - Mock-first via mockInterceptor (PY_*_SOURCE=mock)
 *   - JWT Bearer en memory del modulo (DEC-AUTH-2 de
 *     fix-ui-auth-logout-y-refresh-wiring). Backend Django
 *     usa SIMPLE_JWT con AUTH_HEADER_TYPES=('Bearer',).
 *   - Refresh reactivo al 401 con flag _isRefreshing
 *     (DEC-AUTH-3 + DEC-AUTH-4). Si refresh falla, dispatch
 *     'py:unauthorized' event.
 */

import {
  TimeoutError,
  NetworkError,
  isRetryableError,
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
    // DEC-AUTH-2: tokens en memory del modulo. NO localStorage/
    // sessionStorage por XSS. Trade-off: reload del browser pierde
    // la sesion (UX subóptima vs seguridad).
    this._accessToken   = null;
    this._refreshToken  = null;
    this._isRefreshing  = false;
    // DEC-BC-07: X-Cart-Token para sesion anonima de carrito.
    // Mismo patron memory-only que tokens de auth: XSS-safe, se
    // pierde al cerrar tab (aceptable para comprador anonimo).
    this._cartToken     = null;
  }

  setAuthToken(token) {
    this._accessToken = token || null;
    if (token) this.headers['Authorization'] = `Bearer ${token}`;
    else delete this.headers['Authorization'];
  }

  setRefreshToken(token) {
    this._refreshToken = token || null;
  }

  getRefreshToken() {
    return this._refreshToken;
  }

  clearTokens() {
    this._accessToken = null;
    this._refreshToken = null;
    delete this.headers['Authorization'];
  }

  clearAuthToken() {
    // Backwards-compat: limpia solo el access. Para limpiar ambos
    // usar clearTokens().
    this._accessToken = null;
    delete this.headers['Authorization'];
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

    const url = new URL(path.startsWith('http') ? path : `${this.baseURL}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== null && v !== undefined) url.searchParams.set(k, v);
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
        // DEC-AUTH-1: arquitectura Bearer, no cookies. credentials:
        // 'include' se removio (sin cookies httpOnly que enviar).
        signal:      controller.signal,
      });
    } catch (err) {
      clearTimeout(timerId);
      if (err.name === 'AbortError') throw new TimeoutError(timeout);
      if (attempt < this.retryAttempts) {
        await this._delay(this.retryDelay * attempt);
        return this._request(method, path, options, attempt + 1);
      }
      throw new NetworkError(err.message, err);
    } finally {
      clearTimeout(timerId);
    }

    if (!response.ok) {
      if (RETRYABLE_STATUS.has(response.status) && attempt < this.retryAttempts) {
        await this._delay(this.retryDelay * attempt);
        return this._request(method, path, options, attempt + 1);
      }

      let errorBody = {};
      try { errorBody = await response.json(); } catch { /* respuesta sin JSON: errorBody queda {} */ }

      if (response.status === 401) {
        // DEC-AUTH-3 + DEC-AUTH-4: intento de refresh reactivo con
        // flag _isRefreshing para evitar refreshes concurrentes.
        const canRetry =
          !this._isRefreshing &&
          this._refreshToken &&
          !path.includes('/auth/refresh/') &&
          attempt === 1;

        if (canRetry) {
          this._isRefreshing = true;
          try {
            const refreshUrl = `${this.baseURL}/api/v2/auth/refresh/`;
            const refreshRes = await fetch(refreshUrl, {
              method:  'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body:    JSON.stringify({ refresh: this._refreshToken }),
            });
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              this.setAuthToken(refreshData.access);
              if (refreshData.refresh) this.setRefreshToken(refreshData.refresh);
              this._isRefreshing = false;
              // Reintentar request original con nuevo token.
              return this._request(method, path, options, attempt + 1);
            }
          } catch {
            // Cae al cleanup
          }
          this._isRefreshing = false;
        }

        this.clearTokens();
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
