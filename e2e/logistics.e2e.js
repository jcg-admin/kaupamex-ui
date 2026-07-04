// @ts-check
const { test, expect } = require('@playwright/test');

const BUYER_EMAIL = process.env.E2E_BUYER_EMAIL || 'testbuyer@example.com';
const BUYER_PASS  = process.env.E2E_BUYER_PASS  || 'Test1234!';
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'testadmin@example.com';
const ADMIN_PASS  = process.env.E2E_ADMIN_PASS  || 'Admin1234!';

/** JWT lives in module memory (DEC-AUTH-2) — login by form, no storageState. */
async function login(page, email, pass) {
  await page.goto('/auth/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(pass);
  await page.getByTestId('login-submit').click();
  await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 10000 });
}

// ─── Buyer: shipment tracking (UC-LOG buyer) ─────────────────────────────────

test.describe('logistics / buyer tracking', () => {
  test('order detail renders (tracking card mounts when a guide exists)', async ({ page }) => {
    await login(page, BUYER_EMAIL, BUYER_PASS);
    await page.goto('/account/orders');
    const firstOrder = page.locator('a[href*="/account/orders/"]').first();
    // A buyer may have no orders in a fresh seed — tolerate the empty state.
    if (await firstOrder.isVisible({ timeout: 8000 }).catch(() => false)) {
      await firstOrder.click();
      await expect(page.locator('main').first()).toBeVisible({ timeout: 12000 });
    } else {
      await expect(page.getByText(/no tienes pedidos/i)).toBeVisible({ timeout: 8000 });
    }
  });
});

// ─── Admin: logistics panel, couriers, guide management ──────────────────────

test.describe('logistics / admin', () => {
  test('logistics panel requires auth', async ({ page }) => {
    await page.goto('/admin/logistics');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 8000 });
  });

  test('logistics panel renders for an admin', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await page.goto('/admin/logistics');
    await expect(page.locator('main, section').first()).toBeVisible({ timeout: 12000 });
  });

  test('courier catalog page renders with a create form', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await page.goto('/admin/couriers');
    await expect(page.getByRole('heading', { name: /paqueter/i }).first())
      .toBeVisible({ timeout: 12000 });
    // The "Nueva paquetería" card exposes name and code inputs.
    await expect(page.locator('form').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /crear paqueter/i })).toBeVisible();
  });

  test('courier create validation blocks empty submit', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await page.goto('/admin/couriers');
    await page.getByRole('button', { name: /crear paqueter/i }).click();
    await expect(page.getByText(/el nombre es obligatorio/i)).toBeVisible({ timeout: 8000 });
  });

  test('admin order detail exposes guide management', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await page.goto('/admin/orders');
    const firstOrder = page.locator('a[href*="/admin/orders/"]').first();
    if (await firstOrder.isVisible({ timeout: 8000 }).catch(() => false)) {
      await firstOrder.click();
      await expect(page.locator('main, section').first()).toBeVisible({ timeout: 12000 });
      // The guide panel offers either a create form or an existing guide's
      // management controls — one of these headings should surface.
      await expect(
        page.getByText(/gu[ií]a de env[ií]o|crear gu[ií]a/i).first()
      ).toBeVisible({ timeout: 12000 });
    } else {
      await expect(page.getByText(/sin pedidos/i)).toBeVisible({ timeout: 8000 });
    }
  });
});
