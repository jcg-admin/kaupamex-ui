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

test.describe('notifications / inbox', () => {
  test('notifications page renders after login', async ({ page }) => {
    await loginAsBuyer(page);
    await page.goto('/account/notifications');
    await expect(page.locator('main, section').first()).toBeVisible({ timeout: 10000 });
    // Notifications title or inbox content
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('notification preferences page renders', async ({ page }) => {
    await loginAsBuyer(page);
    await page.goto('/account/notifications/preferences');
    await expect(page.locator('main, section').first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('payments / public callback pages', () => {
  test('payment-return page renders for unknown id', async ({ page }) => {
    // This is a public route — no login required.
    // With a fake id the page should render (possibly showing an error state, not crash).
    await page.goto('/checkout/payment-return/fake-id-000');
    await expect(page.locator('main, section, [role="main"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('order confirmation page renders for unknown id', async ({ page }) => {
    await page.goto('/order/fake-id-000/confirmation');
    await expect(page.locator('main, section, [role="main"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('payment-failed page renders for unknown id', async ({ page }) => {
    await page.goto('/order/fake-id-000/payment-failed');
    await expect(page.locator('main, section, [role="main"]').first()).toBeVisible({ timeout: 10000 });
  });
});
