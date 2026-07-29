/**
 * Tests — apiService X-Cart-Token propagation (DEC-BC-07).
 *
 * T-107: la sesion anonima del carrito persiste cross-request via
 * el header X-Cart-Token. El backend setea el header en el response
 * cuando crea/rota el token; el apiService lo guarda en memory y lo
 * envia en siguientes requests a /api/v2/cart/.
 */
import { APIService } from '@services/apiService';
import mockInterceptor from '@mocks/mockInterceptor';

jest.mock('@mocks/mockInterceptor', () => ({
  __esModule: true,
  default: { intercept: jest.fn(async () => null) },
}));

describe('apiService X-Cart-Token (DEC-BC-07 / B-07)', () => {
  let api;
  let originalFetch;

  beforeEach(() => {
    api = new APIService('http://localhost:8000');
    originalFetch = global.fetch;
    mockInterceptor.intercept.mockResolvedValue(null);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  function makeFetchMock(headersMap, body = {}) {
    return jest.fn(async (url, init) => ({
      ok: true,
      status: 200,
      headers: {
        get: (name) => headersMap[name.toLowerCase()] ?? null,
      },
      json: async () => body,
    }));
  }

  it('extrae X-Cart-Token del response y lo guarda en _cartToken', async () => {
    global.fetch = makeFetchMock({ 'x-cart-token': 'abc-12345' }, { items: [] });

    expect(api.getCartToken()).toBeNull();
    const res = await api.post('/api/v2/cart/items/', { product_id: 1 });

    expect(res.status).toBe(200);
    expect(api.getCartToken()).toBe('abc-12345');
  });

  it('envia X-Cart-Token en siguientes requests a /api/v2/cart/', async () => {
    api.setCartToken('persisted-token-xyz');
    const fetchMock = makeFetchMock({}, { items: [] });
    global.fetch = fetchMock;

    await api.get('/api/v2/cart/');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const sentHeaders = fetchMock.mock.calls[0][1].headers;
    expect(sentHeaders['X-Cart-Token']).toBe('persisted-token-xyz');
  });

  it('NO envia X-Cart-Token a paths fuera de /api/v2/cart/', async () => {
    api.setCartToken('cart-token-private');
    const fetchMock = makeFetchMock({}, {});
    global.fetch = fetchMock;

    await api.get('/api/v2/products/');

    const sentHeaders = fetchMock.mock.calls[0][1].headers;
    expect(sentHeaders['X-Cart-Token']).toBeUndefined();
  });

  it('dos requests consecutivos a cart propagan el token desde el primer response', async () => {
    // Primer request: response del backend trae X-Cart-Token=fresh-abc.
    // Segundo request: debe enviar X-Cart-Token=fresh-abc en headers.
    const firstFetch  = makeFetchMock({ 'x-cart-token': 'fresh-abc' }, { items: [] });
    const secondFetch = makeFetchMock({}, { items: [{ id: 1 }] });

    let call = 0;
    global.fetch = jest.fn(async (url, init) => {
      call += 1;
      return call === 1 ? firstFetch(url, init) : secondFetch(url, init);
    });

    await api.post('/api/v2/cart/items/', { product_id: 1 });
    await api.get('/api/v2/cart/');

    expect(global.fetch).toHaveBeenCalledTimes(2);
    const secondHeaders = global.fetch.mock.calls[1][1].headers;
    expect(secondHeaders['X-Cart-Token']).toBe('fresh-abc');
  });

  it('clearCartToken limpia el token; siguientes requests no lo envian', async () => {
    api.setCartToken('to-be-cleared');
    api.clearCartToken();
    expect(api.getCartToken()).toBeNull();

    const fetchMock = makeFetchMock({}, {});
    global.fetch = fetchMock;
    await api.get('/api/v2/cart/');

    const sentHeaders = fetchMock.mock.calls[0][1].headers;
    expect(sentHeaders['X-Cart-Token']).toBeUndefined();
  });
});

describe('apiService serializacion de params (T-11 multi-categoria)', () => {
  let api;
  let originalFetch;

  beforeEach(() => {
    api = new APIService('http://localhost:8000');
    originalFetch = global.fetch;
    mockInterceptor.intercept.mockResolvedValue(null);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  const okFetch = () => jest.fn(async () => ({
    ok: true, status: 200,
    headers: { get: () => null },
    json: async () => ({}),
  }));

  it('serializa un arreglo como parametro repetible (?k=a&k=b), sin corchetes', async () => {
    const fetchMock = okFetch();
    global.fetch = fetchMock;

    await api.get('/api/v2/products/', { params: { q: 'x', category: ['collares', 'soperas'] } });

    const calledUrl = fetchMock.mock.calls[0][0];
    expect(calledUrl).toContain('q=x');
    expect(calledUrl).toContain('category=collares');
    expect(calledUrl).toContain('category=soperas');
    expect(calledUrl).not.toContain('category%5B%5D');  // no axios-style []
  });

  it('omite valores vacios/nulos dentro del arreglo', async () => {
    const fetchMock = okFetch();
    global.fetch = fetchMock;

    await api.get('/api/v2/products/', { params: { category: ['', 'collares'] } });

    const calledUrl = fetchMock.mock.calls[0][0];
    expect((calledUrl.match(/category=/g) || []).length).toBe(1);
    expect(calledUrl).toContain('category=collares');
  });

  it('un valor escalar sigue serializandose normal', async () => {
    const fetchMock = okFetch();
    global.fetch = fetchMock;

    await api.get('/api/v2/products/', { params: { category: 'collares', page: 2 } });

    const calledUrl = fetchMock.mock.calls[0][0];
    expect(calledUrl).toContain('category=collares');
    expect(calledUrl).toContain('page=2');
  });
});

describe('apiService resolucion de baseURL (SOL-081, same-origin)', () => {
  let originalFetch;

  const okFetch = () => jest.fn(async () => ({
    ok: true, status: 200,
    headers: { get: () => null },
    json: async () => ({}),
  }));

  beforeEach(() => {
    originalFetch = global.fetch;
    mockInterceptor.intercept.mockResolvedValue(null);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('baseURL vacio -> ruta relativa se resuelve contra el origen actual (same-origin)', async () => {
    // Perfil dev: el bundle usa baseURL relativo y el proxy reenvia /api a
    // :8000. La request debe salir MISMA-origin para que viaje la cookie.
    const api = new APIService();
    api.baseURL = '';   // fuerza relativo, sin depender de process.env.API_URL
    const fetchMock = okFetch();
    global.fetch = fetchMock;

    await api.get('/api/v2/admin/logs/');

    const calledUrl = String(fetchMock.mock.calls[0][0]);
    expect(calledUrl).toBe(`${window.location.origin}/api/v2/admin/logs/`);
  });

  it('baseURL absoluto se respeta (prod / API_URL fijado)', async () => {
    const api = new APIService('http://localhost:8000');
    const fetchMock = okFetch();
    global.fetch = fetchMock;

    await api.get('/api/v2/admin/logs/');

    const calledUrl = String(fetchMock.mock.calls[0][0]);
    expect(calledUrl).toBe('http://localhost:8000/api/v2/admin/logs/');
  });
});

describe('apiService reintento solo en metodos idempotentes (H-UI-*, doble cargo)', () => {
  let originalFetch;

  // 503 es reintentable por status, pero el metodo decide si se reintenta.
  const failing503 = () => jest.fn(async () => ({
    ok: false, status: 503,
    headers: { get: () => null },
    json: async () => ({ codigo_error: 'GATEWAY_NOT_CONFIGURED', detail: 'no cableado' }),
  }));

  beforeEach(() => {
    originalFetch = global.fetch;
    mockInterceptor.intercept.mockResolvedValue(null);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('POST con 503 falla al primer intento: no reintenta (evita duplicar el cargo)', async () => {
    const api = new APIService('http://localhost:8000', { retryDelay: 1 });
    const fetchMock = failing503();
    global.fetch = fetchMock;

    await expect(api.post('/api/v2/platform/invoices/42/retry/')).rejects.toBeDefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('PATCH con 503 tampoco reintenta', async () => {
    const api = new APIService('http://localhost:8000', { retryDelay: 1 });
    const fetchMock = failing503();
    global.fetch = fetchMock;

    await expect(api.patch('/api/v2/platform/companies/2/', { name: 'x' })).rejects.toBeDefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('GET con 503 si reintenta hasta agotar los intentos (idempotente)', async () => {
    const api = new APIService('http://localhost:8000', { retryDelay: 1, retryAttempts: 3 });
    const fetchMock = failing503();
    global.fetch = fetchMock;

    await expect(api.get('/api/v2/platform/billing/runs/')).rejects.toBeDefined();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
