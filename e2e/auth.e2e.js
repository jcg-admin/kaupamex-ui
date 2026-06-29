// @ts-check
const { test, expect } = require('@playwright/test');

// Unique suffix per run to avoid username/email collisions on re-runs
const RUN_ID = Date.now().toString(36);

test.describe('auth / login', () => {
  test('invalid credentials show error without navigating', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByTestId('login-email').fill('nobody@nowhere.invalid');
    await page.getByTestId('login-password').fill('WrongPass999!');
    await page.getByTestId('login-submit').click();
    // URL must stay on login
    await expect(page).toHaveURL(/\/auth\/login/);
    // An error message must be visible
    await expect(page.locator('[class*="error"], [class*="alert"], [role="alert"]').first()).toBeVisible({ timeout: 8000 });
  });

  test('valid login navigates away from login page', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByTestId('login-email').fill(process.env.E2E_BUYER_EMAIL || 'testbuyer@example.com');
    await page.getByTestId('login-password').fill(process.env.E2E_BUYER_PASS || 'Test1234!');
    await page.getByTestId('login-submit').click();
    // After login the user lands somewhere other than /auth/login
    await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });
});

test.describe('auth / register', () => {
  test('register page renders all required fields', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page.getByTestId('register-first-name')).toBeVisible();
    await expect(page.getByTestId('register-last-name')).toBeVisible();
    await expect(page.getByTestId('register-email')).toBeVisible();
    await expect(page.getByTestId('register-password')).toBeVisible();
    await expect(page.getByTestId('register-password-confirm')).toBeVisible();
    await expect(page.getByTestId('register-terms')).toBeVisible();
    await expect(page.getByTestId('register-submit')).toBeVisible();
  });

  test('submit without accepting terms shows inline error', async ({ page }) => {
    await page.goto('/auth/register');
    await page.getByTestId('register-first-name').fill('Test');
    await page.getByTestId('register-last-name').fill('User');
    await page.getByTestId('register-email').fill(`e2e_${RUN_ID}@example.com`);
    await page.getByTestId('register-password').fill('Test1234!');
    await page.getByTestId('register-password-confirm').fill('Test1234!');
    // Terms NOT checked
    await page.getByTestId('register-submit').click();
    // Must stay on register
    await expect(page).toHaveURL(/\/auth\/register/);
    await expect(page.getByText(/términos/i).first()).toBeVisible();
  });

  test('successful registration navigates to verify-email', async ({ page }) => {
    await page.goto('/auth/register');
    await page.getByTestId('register-first-name').fill('E2E');
    await page.getByTestId('register-last-name').fill('Buyer');
    await page.getByTestId('register-email').fill(`e2enew_${RUN_ID}@example.com`);
    await page.getByTestId('register-password').fill('Test1234!Password');
    await page.getByTestId('register-password-confirm').fill('Test1234!Password');
    await page.getByTestId('register-terms').check();
    await page.getByTestId('register-submit').click();
    // Should redirect to verify-email or login (depends on email-verification setting)
    await expect(page).not.toHaveURL(/\/auth\/register/, { timeout: 10000 });
  });
});

test.describe('auth / forgot-password', () => {
  test('forgot-password page renders email field and submit', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    await expect(page.getByTestId('forgot-email')).toBeVisible();
    await expect(page.getByTestId('forgot-submit')).toBeVisible();
  });

  test('submitting shows confirmation regardless of whether email exists', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    await page.getByTestId('forgot-email').fill('anyone@example.com');
    await page.getByTestId('forgot-submit').click();
    // Backend returns 200 even for unknown emails (anti-enumeration)
    await expect(page.getByTestId('forgot-sent')).toBeVisible({ timeout: 8000 });
  });
});
