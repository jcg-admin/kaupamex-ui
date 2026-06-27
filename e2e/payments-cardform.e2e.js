/**
 * E2E — MercadoPago Checkout API CardForm
 *
 * Verifies the full on-site payment flow without hitting the real MP SDK:
 *   1. Mock window.MercadoPago via page.addInitScript
 *   2. Mock API endpoints via page.route()
 *   3. Navigate to PaymentSelectionPage
 *   4. Click "Pagar con tarjeta"
 *   5. CardForm mounts (iframes injected by mock MP.js)
 *   6. Click "Pagar con tarjeta" submit → mock cardForm.submit()
 *   7. Assert payment result view shows "¡Pago aprobado!"
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PW_BASE_URL || 'http://localhost:3001';
const API_BASE = process.env.API_URL     || 'http://localhost:8000';

const MP_MOCK_SCRIPT = `
  window.MercadoPago = function MercadoPago(publicKey) {
    this.cardForm = function({ form, callbacks }) {
      // Immediately signal mounted
      if (callbacks && callbacks.onFormMounted) {
        setTimeout(() => callbacks.onFormMounted(null), 50);
      }
      return {
        unmount: function() {},
        submit: function() {
          if (callbacks && callbacks.onSubmit) {
            callbacks.onSubmit();
          }
        },
        getCardFormData: function() {
          return {
            token:           'e2e-test-token-xyz',
            paymentMethodId: 'visa',
            issuerId:        '310',
            installments:    '1',
            payer: {
              email: 'e2e-buyer@test.com',
              identification: { type: 'DNI', number: '12345678' },
            },
          };
        },
      };
    };
  };
`;

test.describe('MercadoPago CardForm E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Inject MP.js mock before any scripts run
    await page.addInitScript({ content: MP_MOCK_SCRIPT });

    // Mock auth state so the page doesn't redirect to login
    await page.addInitScript(`
      window.__TEST_AUTH_TOKEN = 'test-bearer-token';
    `);

    // Mock API: public key
    await page.route(`${API_BASE}/api/v2/payments/public-key/`, route =>
      route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify({ public_key: 'TEST-public-key-e2e' }),
      })
    );

    // Mock API: MP customer
    await page.route(`${API_BASE}/api/v2/payments/customer/`, route =>
      route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify({ mp_customer_id: 'CUST-e2e', email: 'e2e-buyer@test.com' }),
      })
    );

    // Mock API: Checkout API payment (approved)
    await page.route(`${API_BASE}/api/v2/payments/initiate/`, route =>
      route.fulfill({
        status:      201,
        contentType: 'application/json',
        body:        JSON.stringify({
          payment_id:         1,
          gateway_payment_id: 'mp-gw-e2e-001',
          status:             'approved',
          status_detail:      'accredited',
          order_number:       'ORD-E2E-001',
          amount:             '199.00',
          installments:       1,
        }),
      })
    );

    // Mock API: PayPal v1 initiate
    await page.route(`${API_BASE}/api/v1/payments/initiate/`, route =>
      route.fulfill({
        status:      201,
        contentType: 'application/json',
        body:        JSON.stringify({
          payment_id:   999,
          checkout_url: 'https://paypal.example/approve/e2e',
          order_number: 'ORD-E2E-001',
          amount:       '199.00',
        }),
      })
    );
  });

  test('carga la pagina de pago y muestra los gateways', async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout/payment/ORD-E2E-001`);
    await expect(page.locator('h1')).toContainText('Elige tu metodo de pago');
    await expect(page.getByRole('button', { name: /Pagar con tarjeta/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Pagar con PayPal/i })).toBeVisible();
  });

  test('UC-PAY-01-V2: flujo completo CardForm → pago aprobado', async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout/payment/ORD-E2E-001`);

    // Step 1: click to show CardForm
    await page.getByRole('button', { name: /Pagar con tarjeta/i }).click();
    await expect(page.locator('[data-testid="mp-card-form"]')).toBeVisible();

    // Step 2: click submit (mock CardForm.submit → getCardFormData → onPayment)
    await page.getByRole('button', { name: /Pagar con tarjeta/i }).last().click();

    // Step 3: assert payment result
    await expect(page.locator('[data-testid="payment-result"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="payment-result"]')).toContainText('¡Pago aprobado!');
  });

  test('UC-PAY-01-V2: envia token correcto al backend', async ({ page }) => {
    let capturedBody;
    await page.route(`${API_BASE}/api/v2/payments/initiate/`, async route => {
      capturedBody = await route.request().postDataJSON();
      await route.fulfill({
        status:      201,
        contentType: 'application/json',
        body:        JSON.stringify({
          payment_id: 1, gateway_payment_id: 'mp-gw-tok-check',
          status: 'approved', status_detail: 'accredited',
          order_number: 'ORD-E2E-001', amount: '199.00', installments: 1,
        }),
      });
    });

    await page.goto(`${BASE_URL}/checkout/payment/ORD-E2E-001`);
    await page.getByRole('button', { name: /Pagar con tarjeta/i }).click();
    await page.getByRole('button', { name: /Pagar con tarjeta/i }).last().click();

    await expect(page.locator('[data-testid="payment-result"]')).toBeVisible({ timeout: 5000 });
    expect(capturedBody).toMatchObject({
      order_number:      'ORD-E2E-001',
      token:             'e2e-test-token-xyz',
      payment_method_id: 'visa',
    });
  });

  test('vuelve a la seleccion al cancelar el CardForm', async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout/payment/ORD-E2E-001`);
    await page.getByRole('button', { name: /Pagar con tarjeta/i }).click();
    await expect(page.locator('[data-testid="mp-card-form"]')).toBeVisible();

    await page.getByRole('button', { name: /Cancelar/i }).click();
    await expect(page.locator('[data-testid="mp-card-form"]')).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Pagar con tarjeta/i })).toBeVisible();
  });
});
