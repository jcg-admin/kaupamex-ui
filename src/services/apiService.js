/**
 * API Service - PracticaYoruba
 *
 * Maneja todas las llamadas REST al backend Django con:
 *   - Errores tipados (apiErrors.js)
 *   - Retry automatico en errores transitorios
 *   - Timeout con AbortController
 *   - Interceptores de request/response
 *   - Mock-first via mockInterceptor (PY_*_SOURCE=mock)
 *   - httpOnly cookies para JWT (credentials: 'include')
 */

import {
  TimeoutError,
  NetworkError,
  isRetryableError,
  createErrorFromResponse,
} from '@utils/apiErrors';

import mockInterceptor from '@mocks/mockInterceptor';

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
    this._interceptors = { request: [], response: [], error: [] };
  }

  setAuthToken(token) {
    if (token) this.headers['Authorization'] = `Bearer ${token}`;
    else delete this.headers['Authorization'];
  }

  clearAuthToken() { delete this.headers['Authorization']; }

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
    let config = { method, url: url.toString(), headers: { ...this.headers, ...headers } };
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
        body:        body ? JSON.stringify(body) : undefined,
        credentials: 'include',
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
      try { errorBody = await response.json(); } catch {}

      if (response.status === 401) {
        this.clearAuthToken();
        window.dispatchEvent(new CustomEvent('py:unauthorized'));
      }

      const error = createErrorFromResponse({ status: response.status, data: errorBody });
      for (const fn of this._interceptors.error) await fn(error);
      throw error;
    }

    let data = null;
    if (response.status !== 204) {
      try { data = await response.json(); } catch {}
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
