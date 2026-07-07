/**
 * E2E — Prueba del PUENTE de egress a MercadoPago (fixture mp-bridge)
 *   Guarda de regresión del mecanismo que permite tokenizar con MP.js real
 *   dentro del contenedor del agente, que NO tiene egress de navegador.
 *
 * A diferencia de payments-cobro-live.e2e.js (que además hace login + carrito
 * + checkout + cobro contra el backend real), este spec es AUTO-CONTENIDO:
 * solo necesita el fixture `mpBridge` y la public key sandbox. No toca la SPA,
 * ni :8000, ni ninguna cuenta — por eso es la prueba mínima y estable de que
 * "el navegador del contenedor puede tokenizar con MP.js real vía el puente".
 *
 * ── EJECUCIÓN (contenedor del agente) ───────────────────────────────────────
 *   export E2E_MP_BRIDGE=1                 # activa el puente (relay por Node)
 *   export MP_TEST_PUBLIC_KEY=TEST-...     # public key sandbox
 *   # HTTPS_PROXY ya viene del entorno del contenedor.
 *   npx playwright test e2e/payments-mp-bridge.e2e.js
 *
 * Gated por E2E_MP_BRIDGE=1: SKIP en cualquier otro caso (en WSL/CI el navegador
 * tiene egress directo y este puente no aplica).
 */

import { test, expect } from './fixtures/mp-bridge.js';

const BRIDGE     = process.env.E2E_MP_BRIDGE === '1';
const PUBLIC_KEY = process.env.MP_TEST_PUBLIC_KEY || '';

// Tarjeta de PRUEBA oficial de MP México (pública). 'APRO' fuerza aprobación,
// pero aquí solo tokenizamos: comprobamos que MP.js real produce un token.
const APRO_CARD = {
  cardNumber: '5474925432670366',
  cardholderName: 'APRO',
  cardExpirationMonth: '11',
  cardExpirationYear: '2030',
  securityCode: '123',
  identificationType: 'RFC',
  identificationNumber: 'XAXX010101000',
};

test.describe('Puente de egress MP (navegador del contenedor)', () => {
  test.skip(!BRIDGE, 'define E2E_MP_BRIDGE=1 + MP_TEST_PUBLIC_KEY (solo contenedor sin egress de navegador)');

  test('MP.js real carga y tokeniza a través del puente', async ({ browser, mpBridge }) => {
    expect(PUBLIC_KEY, 'MP_TEST_PUBLIC_KEY requerido').toBeTruthy();
    expect(mpBridge.enabled, 'el puente debe estar habilitado (E2E_MP_BRIDGE=1 + HTTPS_PROXY)').toBe(true);

    const context = await browser.newContext();
    await mpBridge.install(context);
    const page = await context.newPage();

    // Origen real del puente (no about:blank) → origen CORS válido para MP.js.
    await page.goto(mpBridge.origin);
    await page.addScriptTag({ url: 'https://sdk.mercadopago.com/js/v2' });
    await expect.poll(
      () => page.evaluate(() => typeof window.MercadoPago === 'function'),
      { message: 'MP.js no cargó (¿el puente relayó el CDN?)', timeout: 15000 },
    ).toBe(true);

    const out = await page.evaluate(async ({ pk, card }) => {
      try {
        const mp = new window.MercadoPago(pk, { locale: 'es-MX' });
        const t = await mp.createCardToken(card);
        return { ok: true, idLen: t?.id ? String(t.id).length : 0, methodId: t?.payment_method_id };
      } catch (e) {
        return { ok: false, err: String(e?.message || e) };
      }
    }, { pk: PUBLIC_KEY, card: APRO_CARD });

    expect(out.ok, `createCardToken falló: ${out.err}`).toBeTruthy();
    // Los tokens de MP son cadenas de 32 hex; exigimos longitud plausible.
    expect(out.idLen, 'MP.js no devolvió token id').toBeGreaterThan(20);

    await context.close();
  });
});
