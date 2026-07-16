// @ts-check
/**
 * E2E — Consola L0: directorio de tenants (UC-PLT-12)
 *
 * El operador de plataforma abre /admin/platform/tenants y ve el directorio
 * de empresas (L1) con su estado, conteos de módulos/usuarios, filtro por
 * estado y el enlace "Provisionar" por fila. Navega, confirma la tabla y
 * captura evidencia.
 *
 * Nota: el verde autoritativo del screenshot es WSL (L-010). El .png vive en
 * e2e/artifacts/ (git-ignored); el spec sí se versiona. Requiere un operador
 * L0 (platform.view) + ≥1 company.
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

test.describe('plataforma / directorio de tenants (L0)', () => {
  test('lista los tenants con estado y enlace a Provisionar', async ({ page }) => {
    await loginAsOperator(page);
    await page.goto('/admin/platform/tenants');

    await expect(page.getByRole('heading', { name: 'Tenants' }))
      .toBeVisible({ timeout: 12000 });
    // El directorio es una tabla con al menos una fila y su enlace Provisionar.
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Provisionar' }).first())
      .toBeVisible();
    // Filtro por estado presente.
    await expect(page.getByLabel('Estado')).toBeVisible();

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'platform-tenants.png'),
      fullPage: true,
    });
  });
});
