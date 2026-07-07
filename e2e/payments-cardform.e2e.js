/**
 * E2E — MercadoPago CardForm (flujo de UI, MOCKEADO)
 *   UC-PAY-01-V2 — pago con tarjeta en sitio (PaymentSelectionPage + MpCardForm)
 *
 * Este spec verifica el WIRING de la UI del paso de pago SIN tocar MP real ni
 * el backend real: mockea window.MercadoPago (MP.js) y las rutas de API. Para
 * el cobro REAL end-to-end contra MP sandbox ver `payments-cobro-live.e2e.js`.
 *
 * Actualizado al rediseño de PaymentSelectionPage (T-PP-02 métodos dinámicos +
 * T-PP-C3): el selector es una lista `mp-method-list` con botones
 * `method-btn-<id>`; se elige `mp-card` para revelar el CardForm, cuyo botón
 * de envío es "Pagar con tarjeta". PayPal ya NO se ofrece en el front.
 *
 * NOTA de ejecución: la página de pago está detrás de auth (ProtectedRoute) y
 * necesita la SPA servida (webpack :3001). Su verde se corre en el harness
 * completo de WSL/CI (auth sembrada + dev server), no en el contenedor del
 * agente. Aquí el spec queda validado por parseo (`playwright test --list`).
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PW_BASE_URL || 'http://localhost:3001';
const API_BASE = process.env.API_URL     || 'http://localhost:8000';
const ORDER    = 'ORD-E2E-001';

// Mock de MP.js: mismo contrato que consume useMpCardForm (cardForm con
// callbacks onFormMounted/onSubmit + getCardFormData).
const MP_MOCK_SCRIPT = `
  window.MercadoPago = function MercadoPago(publicKey, opts) {
    this.cardForm = function({ callbacks }) {
      if (callbacks && callbacks.onFormMounted) {
        setTimeout(() => callbacks.onFormMounted(null), 30);
      }
      return {
        unmount() {},
        submit() { if (callbacks && callbacks.onSubmit) callbacks.onSubmit({ preventDefault() {} }); },
        getCardFormData() {
          return {
            token: 'e2e-test-token-xyz',
            paymentMethodId: 'master',
            issuerId: '310',
            installments: '1',
            payer: { email: 'e2e-buyer@test.com', identification: { type: 'RFC', number: 'XAXX010101000' } },
          };
        },
      };
    };
    this.createCardToken = async () => ({ id: 'e2e-test-token-xyz', payment_method_id: 'master' });
  };
`;

test.describe('MercadoPago CardForm E2E (mocked)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript({ content: MP_MOCK_SCRIPT });

    // Métodos dinámicos (T-PP-02): una tarjeta de crédito + OXXO.
    await page.route(`${API_BASE}/api/v2/payments/methods/`, route =>
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify([
          { id: 'visa', payment_type_id: 'credit_card', name: 'Visa' },
          { id: 'oxxo', payment_type_id: 'ticket',      name: 'OXXO' },
        ]) }));

    // Public key (BR-009): safe para el front.
    await page.route(`${API_BASE}/api/v2/payments/public-key/`, route =>
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ public_key: 'TEST-public-key-e2e' }) }));

    // H-PP-04: al entrar por deep-link sin navigation-state, la página
    // RE-OBTIENE el total autoritativo de la orden (GET /api/v2/orders/<n>/).
    // Sin esto amount<=0 y el CardForm no se monta.
    await page.route(`${API_BASE}/api/v2/orders/${ORDER}/`, route =>
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ order_number: ORDER, status: 'PENDING',
          value: { total: '199.00', subtotal: '199.00', shipping_cost: '0.00' } }) }));

    // Cobro con tarjeta aprobado (endpoint unificado v2).
    await page.route(`${API_BASE}/api/v2/payments/initiate/`, route =>
      route.fulfill({ status: 201, contentType: 'application/json',
        body: JSON.stringify({ payment_id: 1, gateway_payment_id: 'mp-gw-e2e-001',
          status: 'approved', status_detail: 'accredited', order_number: ORDER,
          amount: '199.00', installments: 1 }) }));
  });

  test('muestra el selector de métodos de pago', async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout/payment/${ORDER}`);
    await expect(page.locator('h1#payment-title')).toContainText('Método de pago');
    await expect(page.locator('[data-testid="mp-method-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="method-btn-mp-card"]')).toBeVisible();
  });

  test('UC-PAY-01-V2: CardForm → pago aprobado', async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout/payment/${ORDER}`);

    // Elegir "Tarjeta" en el selector → se revela el CardForm.
    await page.locator('[data-testid="method-btn-mp-card"]').click();
    await expect(page.locator('[data-testid="mp-card-form"]')).toBeVisible();

    // Enviar (el botón se habilita cuando el CardForm mockeado montó).
    const payBtn = page.getByRole('button', { name: /Pagar con tarjeta/i });
    await expect(payBtn).toBeEnabled();
    await payBtn.click();

    // Resultado aprobado.
    await expect(page.locator('[data-testid="payment-result"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="payment-result"]')).toContainText('¡Pago aprobado!');
  });

  test('UC-PAY-01-V2: envía el token correcto al backend', async ({ page }) => {
    let capturedBody;
    await page.route(`${API_BASE}/api/v2/payments/initiate/`, async route => {
      capturedBody = route.request().postDataJSON();
      await route.fulfill({ status: 201, contentType: 'application/json',
        body: JSON.stringify({ payment_id: 1, gateway_payment_id: 'mp-gw-tok-check',
          status: 'approved', status_detail: 'accredited', order_number: ORDER,
          amount: '199.00', installments: 1 }) });
    });

    await page.goto(`${BASE_URL}/checkout/payment/${ORDER}`);
    await page.locator('[data-testid="method-btn-mp-card"]').click();
    const payBtn = page.getByRole('button', { name: /Pagar con tarjeta/i });
    await expect(payBtn).toBeEnabled();
    await payBtn.click();

    await expect(page.locator('[data-testid="payment-result"]')).toBeVisible({ timeout: 5000 });
    expect(capturedBody).toMatchObject({
      order_number:      ORDER,
      token:             'e2e-test-token-xyz',
      payment_method_id: 'master',
    });
  });

  test('cancelar el CardForm vuelve al selector', async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout/payment/${ORDER}`);
    await page.locator('[data-testid="method-btn-mp-card"]').click();
    await expect(page.locator('[data-testid="mp-card-form"]')).toBeVisible();

    await page.getByRole('button', { name: /Cancelar/i }).click();
    await expect(page.locator('[data-testid="mp-card-form"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="mp-method-list"]')).toBeVisible();
  });
});
