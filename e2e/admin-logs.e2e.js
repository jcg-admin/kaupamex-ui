// @ts-check
/**
 * E2E — AdminLogsPage (UC-ADM-06, SOL-011 T-09)
 *
 * Visor tecnico de logs (RequestLog/AppLog). Navega a /admin/logs, confirma
 * el heading, los tabs nativos (Requests/Aplicacion) y la tabla, y captura
 * una evidencia visual (screenshot full-page) en e2e/artifacts/.
 */
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'testadmin@example.com';
const ADMIN_PASS  = process.env.E2E_ADMIN_PASS  || 'Admin1234!';

const ARTIFACTS_DIR = path.join(__dirname, 'artifacts');

/** Login with an is_staff=true user. */
async function loginAsAdmin(page) {
  await page.goto('/auth/login');
  await page.getByTestId('login-email').fill(ADMIN_EMAIL);
  await page.getByTestId('login-password').fill(ADMIN_PASS);
  await page.getByTestId('login-submit').click();
  await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 10000 });
}

test.describe('admin logs (UC-ADM-06)', () => {
  test('logs page renders tabs + table and captures screenshot', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/logs');

    await expect(page.getByRole('heading', { name: /Logs técnicos/i })).toBeVisible({ timeout: 12000 });
    await expect(page.getByRole('tab', { name: /Requests/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Aplicación/i })).toBeVisible();
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'admin-logs.png'), fullPage: true });
  });
});
