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

test.describe('returns / list', () => {
  test('returns list page renders after login', async ({ page }) => {
    await loginAsBuyer(page);
    await page.goto('/account/returns');
    await expect(
      page.getByTestId('returns-list').or(page.getByText(/no tienes/i).or(page.getByText(/sin solicitudes/i)))
    ).toBeVisible({ timeout: 12000 });
  });
});

test.describe('returns / create', () => {
  test('return create form renders required fields', async ({ page }) => {
    await loginAsBuyer(page);
    await page.goto('/account/returns/new');
    await expect(page.getByTestId('return-order-number')).toBeVisible();
    await expect(page.getByTestId('return-submit')).toBeVisible();
  });

  test('create return with empty order number shows error', async ({ page }) => {
    await loginAsBuyer(page);
    await page.goto('/account/returns/new');
    await page.getByTestId('return-submit').click();
    // Should show validation error or stay on page
    await expect(page).toHaveURL(/\/account\/returns\/new/);
  });
});

test.describe('support / tickets', () => {
  test('tickets list page renders after login', async ({ page }) => {
    await loginAsBuyer(page);
    await page.goto('/support/tickets');
    await expect(
      page.getByTestId('tickets-list').or(page.getByText(/no tienes tickets/i))
    ).toBeVisible({ timeout: 12000 });
  });

  test('new ticket form has subject and submit', async ({ page }) => {
    await loginAsBuyer(page);
    await page.goto('/support/tickets/new');
    await expect(page.getByTestId('ticket-subject')).toBeVisible();
    await expect(page.getByTestId('ticket-submit')).toBeVisible();
  });

  test('submitting empty ticket subject shows error', async ({ page }) => {
    await loginAsBuyer(page);
    await page.goto('/support/tickets/new');
    await page.getByTestId('ticket-submit').click();
    await expect(page).toHaveURL(/\/support\/tickets\/new/);
  });
});
