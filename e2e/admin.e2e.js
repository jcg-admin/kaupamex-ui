// @ts-check
const { test, expect } = require('@playwright/test');

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'testadmin@example.com';
const ADMIN_PASS  = process.env.E2E_ADMIN_PASS  || 'Admin1234!';

/** Login with an is_staff=true user. */
async function loginAsAdmin(page) {
  await page.goto('/auth/login');
  await page.getByTestId('login-email').fill(ADMIN_EMAIL);
  await page.getByTestId('login-password').fill(ADMIN_PASS);
  await page.getByTestId('login-submit').click();
  await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 10000 });
}

// ─── Phase 7: Admin catalog ──────────────────────────────────────────────────

test.describe('admin catalog / products', () => {
  test('admin products list renders', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/products');
    await expect(page.locator('main, section').first()).toBeVisible({ timeout: 12000 });
  });

  test('admin product create page renders form', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/products/new');
    await expect(page.locator('form').first()).toBeVisible({ timeout: 10000 });
  });

  test('admin categories page renders', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/categories');
    await expect(page.locator('main, section').first()).toBeVisible({ timeout: 10000 });
  });

  test('admin price sync page renders', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/price-sync');
    await expect(page.locator('main, section').first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Phase 8: Admin orders ───────────────────────────────────────────────────

test.describe('admin orders', () => {
  test('admin orders list renders', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/orders');
    await expect(page.locator('main, section').first()).toBeVisible({ timeout: 12000 });
  });

  test('admin orders dashboard renders', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/orders-dashboard');
    await expect(page.locator('main, section').first()).toBeVisible({ timeout: 12000 });
  });
});

// ─── Phase 9: Admin inventory ────────────────────────────────────────────────

test.describe('admin inventory', () => {
  test('admin inventory list renders', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/inventory');
    await expect(page.locator('main, section').first()).toBeVisible({ timeout: 12000 });
  });

  test('admin inventory import page renders', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/inventory/import');
    await expect(page.locator('main, section').first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Phase 10: Admin comms ───────────────────────────────────────────────────

test.describe('admin comms', () => {
  test('contact messages inbox renders', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/contact/messages');
    await expect(page.locator('main, section').first()).toBeVisible({ timeout: 10000 });
  });

  test('newsletter subscribers page renders', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/newsletter/subscribers');
    await expect(page.locator('main, section').first()).toBeVisible({ timeout: 10000 });
  });

  test('questions answer queue renders', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/questions/answer');
    await expect(page.locator('main, section').first()).toBeVisible({ timeout: 10000 });
  });

  test('reviews moderation queue renders', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/reviews/moderation');
    await expect(page.locator('main, section').first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Phase 11: Admin reports ─────────────────────────────────────────────────

test.describe('admin reports', () => {
  test('reports dashboard renders', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/reports');
    await expect(page.locator('main, section').first()).toBeVisible({ timeout: 12000 });
  });

  test('sales report renders', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/reports/sales');
    await expect(page.locator('main, section').first()).toBeVisible({ timeout: 12000 });
  });

  test('top sellers report renders', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/reports/top-sellers');
    await expect(page.locator('main, section').first()).toBeVisible({ timeout: 12000 });
  });

  test('customers RFM report renders', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/reports/customers-rfm');
    await expect(page.locator('main, section').first()).toBeVisible({ timeout: 12000 });
  });
});

// ─── Phase 12: Admin config + system ─────────────────────────────────────────

test.describe('admin config', () => {
  test('config hub renders', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/config');
    await expect(page.locator('main, section').first()).toBeVisible({ timeout: 10000 });
  });

  test('permissions matrix renders', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/permissions');
    await expect(page.locator('main, section').first()).toBeVisible({ timeout: 10000 });
  });

  test('audit log renders', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/audit-log');
    await expect(page.locator('main, section').first()).toBeVisible({ timeout: 10000 });
  });

  test('system settings renders', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/system-settings');
    await expect(page.locator('main, section').first()).toBeVisible({ timeout: 10000 });
  });

  test('logistics panel renders', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/logistics');
    await expect(page.locator('main, section').first()).toBeVisible({ timeout: 10000 });
  });

  test('payments list renders', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/payments');
    await expect(page.locator('main, section').first()).toBeVisible({ timeout: 10000 });
  });

  test('admin dashboard renders for is_staff user', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');
    await expect(page.locator('main, section').first()).toBeVisible({ timeout: 10000 });
  });

  test('non-admin access to /admin redirects to home', async ({ page }) => {
    // No login — AdminRoute should redirect to /
    await page.goto('/admin');
    await expect(page).not.toHaveURL(/\/admin/, { timeout: 8000 });
  });
});
