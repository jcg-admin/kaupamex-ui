// @ts-check
/**
 * E2E — Consola L0 del operador Kaupamex: provisión de tenant (UC-PLT-05)
 *
 * El operador de plataforma (capacidad platform.provision) abre
 * /admin/platform/provision, elige un tenant y ve los módulos contratables
 * agrupados por familia ERP con su Switch on/off, más el ciclo de facturación
 * y la vigencia. Navega, confirma la rejilla y captura evidencia.
 *
 * Nota: el verde autoritativo del screenshot es WSL (L-010). El .png vive en
 * e2e/artifacts/ (git-ignored); el spec sí se versiona. Requiere un operador
 * L0 sembrado (platform.view/provision) + al menos una company y el catálogo
 * de módulos (seed_authz).
 */
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const OP_EMAIL = process.env.E2E_PLATFORM_EMAIL || 'operador@kaupamex.mx';
const OP_PASS  = process.env.E2E_PLATFORM_PASS  || 'Operador1234!';

const ARTIFACTS_DIR = path.join(__dirname, 'artifacts');

async function loginAsOperator(page) {
  await page.goto('/auth/login');
  await page.getByTestId('login-email').fill(OP_EMAIL);
  await page.getByTestId('login-password').fill(OP_PASS);
  await page.getByTestId('login-submit').click();
  await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 10000 });
}

test.describe('plataforma / provisión de tenant (L0)', () => {
  test('elige un tenant y pinta los módulos por familia con Switch', async ({ page }) => {
    await loginAsOperator(page);
    await page.goto('/admin/platform/provision');

    await expect(page.getByRole('heading', { name: 'Provisión de tenant' }))
      .toBeVisible({ timeout: 12000 });

    // Elegir el primer tenant del selector.
    const companySelect = page.getByLabel('Empresa');
    await expect(companySelect).toBeVisible();
    await companySelect.selectOption({ index: 1 });

    // Aparece la rejilla de módulos contratables con al menos un Switch.
    await expect(page.getByLabel('Módulos contratables')).toBeVisible({ timeout: 12000 });
    await expect(page.getByRole('switch').first()).toBeVisible();
    // El bloque de suscripción (ciclo + vigencia + Guardar).
    await expect(page.getByRole('button', { name: /Guardar provisión/ })).toBeVisible();

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'platform-provision.png'),
      fullPage: true,
    });
  });
});
