// @ts-check
/**
 * E2E — Admin: gestión de contenido estático (UC-CFG-04)
 *
 * El admin (con capacidad settings.manage) abre /admin/content, ve la lista de
 * páginas informativas (Acerca de, Términos, Privacidad, Devoluciones, FAQ),
 * elige una, edita su contenido en el editor rich-text y publica una versión.
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

test.describe('admin / contenido estático', () => {
  test('la página lista las páginas y abre el editor', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/content');

    await expect(page.getByRole('heading', { name: 'Contenido estático' }))
      .toBeVisible({ timeout: 12000 });

    // La navegación de páginas por slug (no una tabla).
    const nav = page.getByRole('navigation', { name: /Páginas de contenido/ });
    await expect(nav).toBeVisible();

    // Elegir la primera página abre el editor rich-text.
    const firstItem = nav.getByRole('button').first();
    await firstItem.click();
    await expect(page.getByLabel('Contenido de la página')).toBeVisible({ timeout: 8000 });

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'admin-static-pages.png'), fullPage: true });
  });
});
