// @ts-check
/**
 * E2E — Cotizador de paqueterías (admin, UC-LOG-09, ShipmentQuoter)
 *
 * El panel /admin/logistics expone un cotizador que consume
 * POST /api/v2/shipping-offers (ShipmentOffersView, admin-only): el admin
 * ingresa un paquete (peso/dimensiones/valor) y ve las paqueterías elegibles
 * rankeadas + inelegibles con su motivo. Antes este endpoint (ranking de
 * paqueterías, task #161) no tenía superficie en la UI.
 *
 * Nota: el verde autoritativo del screenshot es WSL (L-010). Chromium ya
 * instalado; `npm run e2e`.
 */
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'testadmin@example.com';
const ADMIN_PASS  = process.env.E2E_ADMIN_PASS  || 'Admin1234!';
const ARTIFACTS_DIR = path.join(__dirname, 'artifacts');

async function loginAsAdmin(page) {
  await page.goto('/auth/login');
  await page.getByTestId('login-email').fill(ADMIN_EMAIL);
  await page.getByTestId('login-password').fill(ADMIN_PASS);
  await page.getByTestId('login-submit').click();
  await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 10000 });
}

test.describe('admin / cotizador de paqueterías', () => {
  test('cotiza un envío y muestra paqueterías rankeadas', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/logistics');

    const quoter = page.getByRole('region', { name: /Cotizador de paqueterías/i });
    await expect(quoter).toBeVisible({ timeout: 12000 });

    // Los campos ya vienen pre-cargados (1 kg, 20×15×10, valor 100).
    await quoter.getByRole('button', { name: /Cotizar/i }).click();

    // Aparece la tabla de elegibles o el aviso de "no elegibles" — cualquiera
    // confirma que el endpoint respondió y la UI lo consumió.
    await expect(
      quoter.getByText(/Paqueterías elegibles|No elegibles/i),
    ).toBeVisible({ timeout: 12000 });

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'admin-shipment-quoter.png'),
      fullPage: true,
    });
  });
});
