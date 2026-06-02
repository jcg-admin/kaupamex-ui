// @ts-check
const { test, expect } = require('@playwright/test');

const BUYER_EMAIL = process.env.E2E_BUYER_EMAIL || 'testbuyer@example.com';
const BUYER_PASS  = process.env.E2E_BUYER_PASS  || 'Test1234!';

/** Login by form — JWT lives in module memory (DEC-AUTH-2), cannot use storageState. */
async function loginAsBuyer(page) {
  await page.goto('/auth/login');
  await page.getByTestId('login-email').fill(BUYER_EMAIL);
  await page.getByTestId('login-password').fill(BUYER_PASS);
  await page.getByTestId('login-submit').click();
  await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 10000 });
}

test.describe('account / orders', () => {
  test('orders list renders after login', async ({ page }) => {
    await loginAsBuyer(page);
    await page.goto('/account/orders');
    await expect(
      page.getByTestId('orders-list').or(page.getByText(/no tienes pedidos/i))
    ).toBeVisible({ timeout: 12000 });
  });
});

test.describe('account / wishlist', () => {
  test('wishlist renders after login', async ({ page }) => {
    await loginAsBuyer(page);
    await page.goto('/account/wishlist');
    await expect(
      page.getByTestId('wishlist-grid').or(page.getByText(/lista de deseos/i))
    ).toBeVisible({ timeout: 12000 });
  });
});

test.describe('account / profile', () => {
  test('profile page renders with user data', async ({ page }) => {
    await loginAsBuyer(page);
    await page.goto('/account/profile');
    // Profile page should show a form or user info — at minimum the main content area
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
    // There should be some input or display of user info
    await expect(page.locator('input, [data-testid]').first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe('account / addresses', () => {
  test('addresses page renders after login', async ({ page }) => {
    await loginAsBuyer(page);
    await page.goto('/account/addresses');
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('account / change-password', () => {
  test('change-password form renders', async ({ page }) => {
    await loginAsBuyer(page);
    await page.goto('/account/change-password');
    // Expect a form with password fields
    await expect(page.locator('input[type="password"]').first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('account / search-history', () => {
  test('search history page renders', async ({ page }) => {
    await loginAsBuyer(page);
    await page.goto('/account/search-history');
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('account / protected redirect', () => {
  test('unauthenticated access to /account redirects to login', async ({ page }) => {
    await page.goto('/account');
    // ProtectedRoute should redirect unauthenticated users to /auth/login
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 8000 });
  });
});
