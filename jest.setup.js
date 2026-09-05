/**
 * Jest Setup — Kaupamex UI
 * Configuración global para todos los tests
 */

process.env.API_URL = 'http://localhost:8000';

require('@testing-library/jest-dom');

const { server } = require('./src/mocks/server');

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(_query => ({
    matches: false,
    media: _query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const _localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = _localStorageMock;

// Mock window.scrollTo
window.scrollTo = jest.fn();

// jsdom no expone structuredClone (sí existe nativo en el navegador y Node 22).
// Polyfill Date-aware para tests; en producción se usa el nativo.
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = function structuredCloneShim(value) {
    const seen = new WeakMap();
    const clone = (v) => {
      if (v === null || typeof v !== 'object') return v;
      if (v instanceof Date) return new Date(v.getTime());
      if (seen.has(v)) return seen.get(v);
      const out = Array.isArray(v) ? [] : {};
      seen.set(v, out);
      for (const [k, val] of Object.entries(v)) out[k] = clone(val);
      return out;
    };
    return clone(value);
  };
}

// Mock Element.scrollIntoView (jsdom no lo implementa; lo usa CatalogPage
// para posicionar la vista en los productos).
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// Mock IntersectionObserver (usado en lazy loading e imágenes)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() { return null; }
  disconnect() { return null; }
  unobserve() { return null; }
};

// Silenciar console.error de ReactDOM.render deprecation
const _originalError = console.error;
beforeAll(() => {
  console.error = (..._args) => {
    if (
      typeof _args[0] === 'string' &&
      _args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    _originalError.call(console, ..._args);
  };
});

afterAll(() => {
  console.error = _originalError;
});

jest.setTimeout(10000);
