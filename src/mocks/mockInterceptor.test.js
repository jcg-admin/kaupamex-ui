/**
 * Tests — mockInterceptor master switch PY_API_SOURCE (SOL-081, H-UI-LOG-08).
 *
 * En dev el interceptor mockeaba TODO /api ignorando los flags PY_*_SOURCE que
 * su propia cabecera documenta, por lo que el E2E full-stack nunca tocaba el
 * backend real (admin/logs -> _notFound -> 404 -> "No se pudo cargar el log").
 * El master switch PY_API_SOURCE ('db'/'real') desactiva el mock.
 */
import mockInterceptor from '@mocks/mockInterceptor';

describe('mockInterceptor — master switch PY_API_SOURCE (SOL-081)', () => {
  const OLD_NODE_ENV = process.env.NODE_ENV;
  const OLD_SOURCE   = process.env.PY_API_SOURCE;

  afterEach(() => {
    process.env.NODE_ENV     = OLD_NODE_ENV;
    process.env.PY_API_SOURCE = OLD_SOURCE;
  });

  it('PY_API_SOURCE=db en dev -> intercept devuelve null (backend real)', async () => {
    process.env.NODE_ENV      = 'development';
    process.env.PY_API_SOURCE = 'db';

    const r = await mockInterceptor.intercept('/api/v2/admin/logs/', { method: 'GET' });

    expect(r).toBeNull();
  });

  it("PY_API_SOURCE='mock' (default) en dev -> intercept mockea (no null)", async () => {
    process.env.NODE_ENV      = 'development';
    process.env.PY_API_SOURCE = 'mock';

    const r = await mockInterceptor.intercept('/api/v2/products/', { method: 'GET' });

    expect(r).not.toBeNull();
  });

  it('fuera de development -> intercept devuelve null sin importar el flag', async () => {
    process.env.NODE_ENV      = 'production';
    process.env.PY_API_SOURCE = 'mock';

    const r = await mockInterceptor.intercept('/api/v2/products/', { method: 'GET' });

    expect(r).toBeNull();
  });
});
