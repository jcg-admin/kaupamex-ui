// @ts-check
/**
 * E2E — Admin: gestión de banners de portada (UC-CFG-06 / G-CFG-01)
 *
 * El admin (con capacidad banners.manage) abre /admin/banners y ve la galería
 * de banners por placement (Hero / Franja), con el formulario de alta que usa
 * FileUpload para la imagen. Navega, confirma la galería y captura evidencia.
 *
 * Nota: el verde autoritativo del screenshot es WSL (L-010). El .png vive en
 * e2e/artifacts/ (git-ignored); el spec sí se versiona.
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

test.describe('admin / banners de portada', () => {
  test('la página muestra la galería por placement y el form de alta', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/banners');

    await expect(page.getByRole('heading', { name: 'Banners de portada' }))
      .toBeVisible({ timeout: 12000 });
    // Secciones por placement (Hero + Franja).
    await expect(page.getByRole('heading', { name: 'Hero de portada' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Franja promocional' })).toBeVisible();
    // El alta usa FileUpload (input[type=file]), no un campo de texto de URL.
    await expect(page.locator('input[type="file"][accept="image/*"]')).toBeAttached();

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'admin-banners.png'), fullPage: true });
  });
});
