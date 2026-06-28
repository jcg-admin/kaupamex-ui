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

    await api.get('/api/v1/catalogue/');

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
