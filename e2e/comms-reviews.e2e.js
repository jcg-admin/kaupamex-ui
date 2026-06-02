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
