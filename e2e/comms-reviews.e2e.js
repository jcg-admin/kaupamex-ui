// @ts-check
const { test, expect } = require('@playwright/test');

const BUYER_EMAIL = process.env.E2E_BUYER_EMAIL || 'testbuyer@example.com';
const BUYER_PASS  = process.env.E2E_BUYER_PASS  || 'Test1234!';

async function loginAsBuyer(page) {
  await page.goto('/auth/login');
  await page.getByTestId('login-email').fill(BUYER_EMAIL);
  await page.getByTestId('login-password').fill(BUYER_PASS);
  await page.getByTestId('login-submit').click();
  await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 10000 });
}

test.describe('comms / contact form', () => {
  test('contact form page renders', async ({ page }) => {
    await page.goto('/contact');
    // Should have a form with at minimum an email and message field
    await expect(page.locator('main').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('form').first()).toBeVisible();
  });
});

test.describe('comms / newsletter', () => {
  test('newsletter subscribe page renders', async ({ page }) => {
    await page.goto('/newsletter');
    await expect(page.locator('main').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
  });
});

test.describe('info / static pages', () => {
  test('info page renders (may 404 if not seeded)', async ({ page }) => {
    await page.goto('/info/terms');
    // Either the page content or a 404 page — should not crash
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe('help page', () => {
  test('help page renders', async ({ page }) => {
    await page.goto('/help');
    await expect(page.locator('main').first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe('reviews / create', () => {
  test('review create route requires login', async ({ page }) => {
    // Without login, should redirect to /auth/login
    await page.goto('/account/orders/fake-order/products/fake-product/review');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 8000 });
  });
});

test.describe('reviews / public list', () => {
  test('product reviews list renders from a catalog product', async ({ page }) => {
    // Navigate through the catalog to reach a real product, then open its
    // public reviews list (UC-REV-02). Resilient to unknown seeded ids.
    await page.goto('/catalog');
    const firstProduct = page.locator('a[href*="/catalog/"]').first();
    await expect(firstProduct).toBeVisible({ timeout: 12000 });
    await firstProduct.click();
    const match = new URL(page.url()).pathname.match(/\/catalog\/([^/]+)/);
    if (match) {
      await page.goto(`/catalog/${match[1]}/reviews`);
      await expect(page.getByRole('heading', { name: /rese/i }).first())
        .toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('reviews / admin moderation', () => {
  test('moderation route requires auth', async ({ page }) => {
    // Anonymous users must be bounced to login (admin-guarded route).
    await page.goto('/admin/reviews/moderation');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 8000 });
  });

  test('moderation queue renders for an admin', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByTestId('login-email').fill(process.env.E2E_ADMIN_EMAIL || 'testadmin@example.com');
    await page.getByTestId('login-password').fill(process.env.E2E_ADMIN_PASS || 'Admin1234!');
    await page.getByTestId('login-submit').click();
    await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 10000 });
    await page.goto('/admin/reviews/moderation');
    await expect(page.locator('main, section').first()).toBeVisible({ timeout: 12000 });
  });
});
