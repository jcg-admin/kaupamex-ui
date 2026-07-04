// @ts-check
// E2E — el dropdown "Mi cuenta" del Header cae DENTRO de la pantalla (#77).
//
// Bug: useFloating devolvía coordenadas de documento (rect.left + scrollX),
// pero el panel se renderiza dentro de un wrapper position:relative, así que
// su position:absolute se resolvía respecto del wrapper → el panel quedaba
// empujado ~Xpx a la derecha del trigger, fuera del viewport. Fix: coordenadas
// relativas al offsetParent del panel.
const { test, expect } = require('@playwright/test');

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'testadmin@example.com';
const ADMIN_PASS  = process.env.E2E_ADMIN_PASS  || 'Admin1234!';

async function login(page) {
  await page.goto('/auth/login');
  await page.getByTestId('login-email').fill(ADMIN_EMAIL);
  await page.getByTestId('login-password').fill(ADMIN_PASS);
  await page.getByTestId('login-submit').click();
  await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 10000 });
}

test.describe('Header — dropdown "Mi cuenta" (#77)', () => {
  test('el panel abre dentro del viewport (no fuera de pantalla)', async ({ page }) => {
    await login(page);
    await page.goto('/');

    // Abrir el dropdown "Mi cuenta" (el trigger es un <span> con aria-haspopup).
    const trigger = page.locator('[aria-haspopup="menu"]').filter({ hasText: /Mi cuenta/i }).first();
    await expect(trigger).toBeVisible({ timeout: 10000 });
    await trigger.click();

    const panel = page.locator('[role="menu"]').first();
    await expect(panel).toBeVisible({ timeout: 5000 });

    const box = await panel.boundingBox();
    const viewport = page.viewportSize();
    expect(box, 'el panel debe tener bounding box').not.toBeNull();
    // Debe estar completamente dentro del viewport horizontalmente.
    expect(box.x, `panel.x=${box.x} < 0 (sale por la izquierda)`).toBeGreaterThanOrEqual(-1);
    expect(
      box.x + box.width,
      `panel derecho=${box.x + box.width} > viewport=${viewport.width} (sale por la derecha)`,
    ).toBeLessThanOrEqual(viewport.width + 1);
    // Y debe caer justo debajo del trigger (no en la esquina 0,0 inicial).
    const tb = await trigger.boundingBox();
    expect(box.y, `panel.y=${box.y} no está debajo del trigger (${tb.y + tb.height})`)
      .toBeGreaterThanOrEqual(tb.y);
  });

  test('el item "Cerrar sesión" es accesible dentro del panel', async ({ page }) => {
    await login(page);
    await page.goto('/');
    const trigger = page.locator('[aria-haspopup="menu"]').filter({ hasText: /Mi cuenta/i }).first();
    await trigger.click();
    const logout = page.getByRole('menuitem', { name: /Cerrar sesión/i }).first();
    await expect(logout).toBeVisible({ timeout: 5000 });
    const box = await logout.boundingBox();
    const viewport = page.viewportSize();
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  });
});
