/**
 * API Service — PracticaYoruba
 *
 * Maneja todas las llamadas REST al backend Django con:
 *   - Retry automático en errores transitorios (503, network)
 *   - Timeout configurable por request
 *   - Interceptores de request/response
 *   - Errores tipados
 *   - Soporte para mock en desarrollo
 */

const DEFAULT_TIMEOUT        = 30_000;  // 30 s
const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY    = 1_000;   // 1 s

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
    this._interceptors = { request: [], response: [], error: [] };
  }

  // ─── Token (no almacenado — solo para la sesión actual) ───────────
  setAuthToken(token) {
    if (token) {
      this.headers['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.headers['Authorization'];
    }
  }

  clearAuthToken() { delete this.headers['Authorization']; }

  // ─── Interceptores ─────────────────────────────────────────────────
  addRequestInterceptor(fn)  { this._interceptors.request.push(fn); }
  addResponseInterceptor(fn) { this._interceptors.response.push(fn); }
  addErrorInterceptor(fn)    { this._interceptors.error.push(fn); }

  // ─── Core request ──────────────────────────────────────────────────
  async _request(method, path, options = {}, attempt = 1) {
    const { body, params, timeout = this.timeout, headers = {} } = options;

    // Construir URL con query params
    const url = new URL(
      path.startsWith('http') ? path : `${this.baseURL}${path}`
    );
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== null && v !== undefined) url.searchParams.set(k, v);
      });
    }

    // Aplicar interceptores de request
    let config = { method, url: url.toString(), headers: { ...this.headers, ...headers } };
    for (const fn of this._interceptors.request) {
      config = (await fn(config)) ?? config;
    }

    // AbortController para timeout
    const controller = new AbortController();
    const timerId    = setTimeout(() => controller.abort(), timeout);

    let response;
    try {
      response = await fetch(config.url, {
        method:      config.method,
        headers:     config.headers,
        body:        body ? JSON.stringify(body) : undefined,
        credentials: 'include',  // cookies httpOnly para JWT
        signal:      controller.signal,
      });
    } catch (err) {
      clearTimeout(timerId);
      if (err.name === 'AbortError') throw new Error('Request timeout');
      // Retry en errores de red
      if (attempt < this.retryAttempts) {
        await this._delay(this.retryDelay * attempt);
        return this._request(method, path, options, attempt + 1);
      }
      throw new Error(`Network error: ${err.message}`);
    } finally {
      clearTimeout(timerId);
    }

    // Manejo de errores HTTP
    if (!response.ok) {
      // Retry en errores retryable
      if (RETRYABLE_STATUS.has(response.status) && attempt < this.retryAttempts) {
        await this._delay(this.retryDelay * attempt);
        return this._request(method, path, options, attempt + 1);
      }

      let errorBody = {};
      try { errorBody = await response.json(); } catch {}

      // 401 — limpiar auth
      if (response.status === 401) {
        this.clearAuthToken();
        window.dispatchEvent(new CustomEvent('py:unauthorized'));
      }

      const message = errorBody.detail
        || errorBody.message
        || Object.values(errorBody).flat().join(', ')
        || `HTTP ${response.status}`;

      const error = new Error(message);
      error.status = response.status;
      error.body   = errorBody;

      for (const fn of this._interceptors.error) await fn(error);
      throw error;
    }

    // Parse JSON (204 No Content retorna null)
    let data = null;
    if (response.status !== 204) {
      try { data = await response.json(); } catch {}
    }

    // Aplicar interceptores de response
    let result = { data, status: response.status, headers: response.headers };
    for (const fn of this._interceptors.response) {
      result = (await fn(result)) ?? result;
    }

    return result;
  }

  _delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

  // ─── Métodos HTTP públicos ─────────────────────────────────────────
  get(path, options)              { return this._request('GET',    path, options); }
  post(path, body, options)       { return this._request('POST',   path, { ...options, body }); }
  put(path, body, options)        { return this._request('PUT',    path, { ...options, body }); }
  patch(path, body, options)      { return this._request('PATCH',  path, { ...options, body }); }
  delete(path, options)           { return this._request('DELETE', path, options); }
}

// Instancia singleton
const apiService = new APIService();
export default apiService;
export { APIService };
