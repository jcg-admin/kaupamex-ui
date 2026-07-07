/**
 * E2E — Cobro REAL en navegador contra MercadoPago sandbox (Nivel B)
 *   UC-PAY-01-V2 — MercadoPago Checkout API (CardForm en sitio)
 *
 * A diferencia de payments-cardform.e2e.js (que MOCKEA MP.js y el backend),
 * este spec prueba el camino REAL end-to-end desde el navegador:
 *
 *   1. Login por API como comprador QA → cookie de sesión en el contexto.
 *   2. Crear una orden PENDING desechable (carrito → checkout con envío
 *      derivado GRATIS) → order_number + total.
 *   3. En el NAVEGADOR: cargar MP.js v2 real desde el CDN y tokenizar la
 *      tarjeta de PRUEBA APRO con createCardToken() (equivalente headless
 *      de lo que hace el CardForm de la app; evita teclear en los iframes
 *      seguros de MP.js, que son frágiles en headless).
 *   4. POST real a /api/v2/payments/initiate/ con ese token → el backend
 *      cobra en el sandbox de MP → assert approved + Order PAID.
 *
 * Esto prueba que MP.js carga y tokeniza en un navegador real y que el token
 * resultante produce un cobro aprobado contra el backend real. (El llenado
 * visual de los iframes seguros — "Opción 2" — queda como follow-up estricto.)
 *
 * ── EJECUCIÓN (solo donde el navegador tiene egress externo) ────────────────
 * Requiere: stack completo levantado + egress a sdk.mercadopago.com y
 * api.mercadopago.com. El contenedor del agente NO tiene egress de navegador
 * (verificado: example.com → ERR_CONNECTION_RESET), así que este spec SOLO
 * corre en WSL/CI. Gated por E2E_MP_LIVE=1; SKIP en cualquier otro caso.
 *
 *   # 1) DB + api dev (:8000) + webpack dev (:3001) con datos sembrados:
 *   #    setup_mp_gateway (claves sandbox), un producto publicado con stock,
 *   #    y el comprador QA (QA_BUYER_EMAIL/QA_BUYER_PASSWORD).
 *   # 2) Variables:
 *   export E2E_MP_LIVE=1
 *   export PW_BASE_URL=http://localhost:3001          # SPA
 *   export E2E_API_BASE=http://localhost:8000         # Django
 *   export MP_TEST_PUBLIC_KEY=TEST-....               # public key sandbox
 *   export QA_BUYER_EMAIL=... QA_BUYER_PASSWORD=...
 *   export E2E_PRODUCT_ID=<id de un producto publicado con stock>
 *   # 3) npx playwright test e2e/payments-cobro-live.e2e.js
 */

import { test, expect } from '@playwright/test';

const LIVE      = process.env.E2E_MP_LIVE === '1';
const API_BASE  = process.env.E2E_API_BASE || process.env.API_URL || 'http://localhost:8000';
const PUBLIC_KEY = process.env.MP_TEST_PUBLIC_KEY || '';
const BUYER_EMAIL = process.env.QA_BUYER_EMAIL || '';
const BUYER_PASS  = process.env.QA_BUYER_PASSWORD || '';
const PRODUCT_ID  = process.env.E2E_PRODUCT_ID || '';

// Tarjeta de PRUEBA oficial de MP México (pública, libre). El nombre del
// titular 'APRO' fuerza a MP a aprobar el pago.
const APRO_CARD = {
  cardNumber: '5474925432670366',
  cardholderName: 'APRO',
  cardExpirationMonth: '11',
  cardExpirationYear: '2030',
  securityCode: '123',
  identificationType: 'RFC',
  identificationNumber: 'XAXX010101000',
};

// SKIP salvo que estemos en un entorno con egress de navegador + claves.
test.describe('Cobro real MP sandbox (navegador)', () => {
  test.skip(!LIVE, 'define E2E_MP_LIVE=1 + stack levantado + MP_TEST_* (solo WSL/CI; el contenedor no tiene egress de navegador)');

  test('UC-PAY-01-V2: MP.js tokeniza y el backend cobra → approved', async ({ browser }) => {
    expect(PUBLIC_KEY, 'MP_TEST_PUBLIC_KEY requerido').toBeTruthy();
    expect(BUYER_EMAIL && BUYER_PASS, 'QA_BUYER_EMAIL/PASSWORD requeridos').toBeTruthy();
    expect(PRODUCT_ID, 'E2E_PRODUCT_ID (producto publicado con stock) requerido').toBeTruthy();

    const context = await browser.newContext({ baseURL: process.env.PW_BASE_URL || 'http://localhost:3001' });
    const api = context.request;

    // 1) Login por API (deja la cookie de sesión en el contexto).
    //    El endpoint espera { username, password } (username = email del QA).
    const login = await api.post(`${API_BASE}/api/v2/auth/login/`, {
      data: { username: BUYER_EMAIL, password: BUYER_PASS },
    });
    expect(login.ok(), `login falló: ${login.status()}`).toBeTruthy();

    // 2) Carrito → checkout → orden PENDING (envío derivado, GRATIS).
    const addToCart = await api.post(`${API_BASE}/api/v2/cart/items/`, {
      data: { product_id: Number(PRODUCT_ID), quantity: 1 },
    });
    expect(addToCart.ok(), `add-to-cart falló: ${addToCart.status()}`).toBeTruthy();

    const checkout = await api.post(`${API_BASE}/api/v2/orders/checkout/`, {
      data: {
        shipping_address: {
          full_name: 'QA Buyer', phone: '5555555555',
          street: 'Calle QA 1', city: 'CDMX', state: 'CDMX',
          postal_code: '01000', country: 'MX',
        },
      },
    });
    expect(checkout.ok(), `checkout falló: ${checkout.status()} ${await checkout.text()}`).toBeTruthy();
    const order = await checkout.json();
    const orderNumber = order.order_number || order.number;
    const amount = String(order.value?.total ?? order.total ?? '199.00');
    expect(orderNumber, 'checkout no devolvió order_number').toBeTruthy();

    // 3) Navegador real: cargar MP.js del CDN y tokenizar la tarjeta APRO.
    const page = await context.newPage();
    await page.goto('/');
    await page.addScriptTag({ url: 'https://sdk.mercadopago.com/js/v2' });
    await expect.poll(
      () => page.evaluate(() => typeof window.MercadoPago === 'function'),
      { message: 'MP.js no cargó (¿egress al CDN?)', timeout: 15000 },
    ).toBe(true);

    const tokenOut = await page.evaluate(async ({ pk, card }) => {
      try {
        const mp = new window.MercadoPago(pk, { locale: 'es-MX' });
        const t = await mp.createCardToken(card);
        return { ok: true, id: t?.id, methodId: t?.payment_method_id };
      } catch (e) {
        return { ok: false, err: String(e?.message || e) };
      }
    }, { pk: PUBLIC_KEY, card: APRO_CARD });
    expect(tokenOut.ok, `createCardToken falló: ${tokenOut.err}`).toBeTruthy();
    expect(tokenOut.id, 'MP.js no devolvió token id').toBeTruthy();

    // 4) POST real al backend → cobra en MP sandbox → approved + Order PAID.
    const initiate = await api.post(`${API_BASE}/api/v2/payments/initiate/`, {
      data: {
        order_number: orderNumber,
        token: tokenOut.id,
        payment_method_id: tokenOut.methodId || 'master',
        installments: 1,
        payer_email: BUYER_EMAIL,
      },
    });
    expect(initiate.ok(), `initiate falló: ${initiate.status()} ${await initiate.text()}`).toBeTruthy();
    const result = await initiate.json();
    expect(result.status, `MP status inesperado: ${JSON.stringify(result)}`).toBe('approved');

    // La orden debe quedar PAID (cobro síncrono aprobado).
    const detail = await api.get(`${API_BASE}/api/v1/orders/${orderNumber}/`);
    expect(detail.ok()).toBeTruthy();
    const orderDetail = await detail.json();
    expect(orderDetail.status).toBe('PAID');

    await context.close();
  });
});
