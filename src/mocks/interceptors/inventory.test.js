/**
 * Tests — inventory mock interceptor (D-007).
 *
 * Verifica que el mock se comporte como el contrato real para:
 *   - GET listado con summary y status calculado por umbral.
 *   - GET movimientos por variante (URL prefix variants/<id>/).
 *   - POST ajustar stock (codigos 200/400/404/409).
 *   - POST import CSV (201).
 */
import {
  interceptInventory,
  __resetInventoryState,
} from './inventory';

beforeEach(() => __resetInventoryState());

describe('mocks/interceptors/inventory', () => {
  it('GET /api/v1/admin/inventory/ retorna results + summary con keys en ingles', () => {
    const r = interceptInventory('/api/v1/admin/inventory/', { method: 'GET' });
    expect(r.status).toBe(200);
    expect(Array.isArray(r.data.results)).toBe(true);
    expect(r.data).toHaveProperty('summary');
    expect(r.data.summary).toHaveProperty('productos_normales');
    expect(r.data.summary).toHaveProperty('productos_bajo_stock');
    expect(r.data.summary).toHaveProperty('productos_agotados');
  });

  it('cada item incluye status calculado (NORMAL/BAJO/AGOTADO)', () => {
    const r = interceptInventory('/api/v1/admin/inventory/', { method: 'GET' });
    const statuses = r.data.results.map((i) => i.status);
    expect(statuses).toEqual(expect.arrayContaining(['NORMAL', 'BAJO', 'AGOTADO']));
  });

  it('GET variants/<id>/movements/ retorna movimientos con type en ingles', () => {
    const r = interceptInventory('/api/v1/admin/inventory/variants/1/movements/', { method: 'GET' });
    expect(r.status).toBe(200);
    expect(Array.isArray(r.data.results)).toBe(true);
    expect(r.data.results[0]).toHaveProperty('type');
    expect(['SALE', 'CANCELLATION', 'MANUAL']).toContain(r.data.results[0].type);
  });

  it('GET movements de variante sin movimientos retorna lista vacia', () => {
    const r = interceptInventory('/api/v1/admin/inventory/variants/9999/movements/', { method: 'GET' });
    expect(r.status).toBe(200);
    expect(r.data.results).toEqual([]);
  });

  it('POST adjust con new_quantity valido devuelve 200 + nuevo stock', () => {
    const r = interceptInventory('/api/v1/admin/inventory/variants/1/adjust/', {
      method: 'POST',
      body:   JSON.stringify({ new_quantity: 15, reason: 'CONTEO_FISICO' }),
    });
    expect(r.status).toBe(200);
    expect(r.data.new_stock).toBe(15);
    expect(r.data.movement.type).toBe('MANUAL');
    // El listado debe reflejar el cambio.
    const list = interceptInventory('/api/v1/admin/inventory/', { method: 'GET' });
    const v1   = list.data.results.find((i) => i.variant_id === 1);
    expect(v1.stock).toBe(15);
  });

  it('POST adjust sin reason devuelve 400', () => {
    const r = interceptInventory('/api/v1/admin/inventory/variants/1/adjust/', {
      method: 'POST',
      body:   JSON.stringify({ new_quantity: 10 }),
    });
    expect(r.status).toBe(400);
  });

  it('POST adjust con new_quantity negativo devuelve 409', () => {
    const r = interceptInventory('/api/v1/admin/inventory/variants/1/adjust/', {
      method: 'POST',
      body:   JSON.stringify({ new_quantity: -1, reason: 'MERMA' }),
    });
    expect(r.status).toBe(409);
    expect(r.data.detail).toMatch(/STOCK_NEGATIVO/);
  });

  it('POST adjust sobre variante inexistente devuelve 404', () => {
    const r = interceptInventory('/api/v1/admin/inventory/variants/999/adjust/', {
      method: 'POST',
      body:   JSON.stringify({ new_quantity: 5, reason: 'AJUSTE' }),
    });
    expect(r.status).toBe(404);
  });

  it('POST /api/v1/admin/inventory/import/ devuelve 201 con reporte', () => {
    const r = interceptInventory('/api/v1/admin/inventory/import/', {
      method: 'POST',
      body:   new FormData(),
    });
    expect(r.status).toBe(201);
    expect(r.data).toHaveProperty('created');
    expect(r.data).toHaveProperty('updated');
    expect(r.data).toHaveProperty('errors');
    expect(r.data).toHaveProperty('download_url');
  });

  it('retorna null para URLs fuera del dominio inventory', () => {
    expect(interceptInventory('/api/v1/orders/', { method: 'GET' })).toBeNull();
    expect(interceptInventory('/api/auth/me/', { method: 'GET' })).toBeNull();
  });
});
