// @ts-check
/**
 * E2E — AccountLayout badge de notificaciones no leídas (SOL-011, BadgeContainer)
 *
 * El sidebar de la cuenta del comprador muestra el conteo de notificaciones
 * no leídas junto al ítem "Notificaciones" (BadgeContainer + Badge), consumiendo
 * el hook useUnreadNotificationsCount (antes huérfano). La campana NO va en el
 * Header global (decisión previa). Navega a /account, confirma el ítem y captura
 * evidencia; si hay no leídas sembradas, aparece el badge.
 *
 * Nota: el verde autoritativo del screenshot es WSL (L-010).
 */
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const BUYER_EMAIL = process.env.E2E_BUYER_EMAIL || 'testbuyer@example.com';
const BUYER_PASS  = process.env.E2E_BUYER_PASS  || 'Test1234!';

const ARTIFACTS_DIR = path.join(__dirname, 'artifacts');

async function loginAsBuyer(page) {
  await page.goto('/auth/login');
  await page.getByTestId('login-email').fill(BUYER_EMAIL);
  await page.getByTestId('login-password').fill(BUYER_PASS);
  await page.getByTestId('login-submit').click();
  await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 10000 });
}

test.describe('account / badge de notificaciones', () => {
  test('el sidebar expone Notificaciones (con badge de no leídas si las hay)', async ({ page }) => {
    await loginAsBuyer(page);
    await page.goto('/account');

    const nav = page.getByRole('navigation', { name: /menu de cuenta/i });
    await expect(nav).toBeVisible({ timeout: 12000 });
    // El ítem enlaza al inbox de notificaciones.
    const notifLink = nav.getByRole('link', { name: /Notificaciones/i });
    await expect(notifLink).toBeVisible();
    await expect(notifLink).toHaveAttribute('href', /\/account\/notifications$/);

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'account-notifications-badge.png'), fullPage: true });
  });
});
