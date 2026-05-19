/**
 * Tests — returns mock interceptor (D-007).
 *
 * Verifica que el mock se comporte como el contrato real:
 *   - JSON keys en ingles (DEC-DOC-005).
 *   - Status codes correctos (200/201/400/404/409).
 *   - Flujo admin coherente (aprobar -> queda APROBADA en la lista).
 */
import {
  interceptReturns,
  __resetReturnsState,
} from './returns';

beforeEach(() => __resetReturnsState());

describe('mocks/interceptors/returns', () => {
  it('GET /api/v1/returns/ retorna la lista con results y count', () => {
    const r = interceptReturns('/api/v1/returns/', { method: 'GET' });
    expect(r.status).toBe(200);
    expect(Array.isArray(r.data.results)).toBe(true);
    expect(r.data.count).toBe(r.data.results.length);
  });

  it('GET /api/v1/returns/<id>/ devuelve el detalle del comprador', () => {
    const r = interceptReturns('/api/v1/returns/1/', { method: 'GET' });
    expect(r.status).toBe(200);
    expect(r.data.id).toBe(1);
    // El contrato exige claves inglesas.
    expect(r.data).toHaveProperty('order_id');
    expect(r.data).toHaveProperty('status');
    expect(r.data).toHaveProperty('items');
  });

  it('GET inexistente retorna 404', () => {
    const r = interceptReturns('/api/v1/returns/999/', { method: 'GET' });
    expect(r.status).toBe(404);
    expect(r.data.detail).toMatch(/no encontrada/i);
  });

  it('POST /api/v1/returns/ crea (201) con order_id + reason', () => {
    const r = interceptReturns('/api/v1/returns/', {
      method: 'POST',
      body:   JSON.stringify({ order_id: 'ORD-9999', reason: 'WRONG_ITEM' }),
    });
    expect(r.status).toBe(201);
    expect(r.data.order_id).toBe('ORD-9999');
    expect(r.data.status).toBe('PENDIENTE_REVISION');
  });

  it('POST sin reason devuelve 400', () => {
    const r = interceptReturns('/api/v1/returns/', {
      method: 'POST',
      body:   JSON.stringify({ order_id: 'ORD-9999' }),
    });
    expect(r.status).toBe(400);
  });

  it('GET /api/v1/admin/returns/ incluye metrics + results', () => {
    const r = interceptReturns('/api/v1/admin/returns/', { method: 'GET' });
    expect(r.status).toBe(200);
    expect(r.data).toHaveProperty('results');
    expect(r.data).toHaveProperty('metrics');
    expect(r.data.metrics).toHaveProperty('pendientes');
    expect(r.data.metrics).toHaveProperty('aprobadas');
  });

  it('POST approve actualiza el status del item', () => {
    const r = interceptReturns('/api/v1/admin/returns/1/approve/', {
      method: 'POST',
      body:   JSON.stringify({ justification: 'OK' }),
    });
    expect(r.status).toBe(200);
    expect(r.data.status).toBe('APROBADA');

    const after = interceptReturns('/api/v1/admin/returns/1/', { method: 'GET' });
    expect(after.data.status).toBe('APROBADA');
  });

  it('POST reject sin justification devuelve 400', () => {
    const r = interceptReturns('/api/v1/admin/returns/1/reject/', {
      method: 'POST',
      body:   JSON.stringify({}),
    });
    expect(r.status).toBe(400);
  });

  it('POST refund antes de RECIBIDA devuelve 409', () => {
    const r = interceptReturns('/api/v1/admin/returns/1/refund/', {
      method: 'POST',
      body:   JSON.stringify({ amount: 1250 }),
    });
    expect(r.status).toBe(409);
  });

  it('POST reception -> refund flujo completo', () => {
    interceptReturns('/api/v1/admin/returns/1/reception/', {
      method: 'POST',
      body:   JSON.stringify({ product_condition: 'GOOD' }),
    });
    const r = interceptReturns('/api/v1/admin/returns/1/refund/', {
      method: 'POST',
      body:   JSON.stringify({ amount: 1250 }),
    });
    expect(r.status).toBe(200);
    expect(r.data.status).toBe('REEMBOLSADA');
    expect(r.data.refund.amount).toBe(1250);
  });

  it('retorna null para URLs fuera del dominio returns', () => {
    expect(interceptReturns('/api/v1/orders/', { method: 'GET' })).toBeNull();
    expect(interceptReturns('/api/auth/me/',   { method: 'GET' })).toBeNull();
  });
});
