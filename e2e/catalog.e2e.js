// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('catalog / browse', () => {
  test('catalog page loads product grid', async ({ page }) => {
    await page.goto('/catalog');
    // Wait for grid or empty state — either is valid
    await expect(
      page.getByTestId('catalog-grid').or(page.getByText(/sin productos/i))
    ).toBeVisible({ timeout: 12000 });
  });

  test('product card links to product detail page', async ({ page }) => {
    await page.goto('/catalog');
    const firstCard = page.getByTestId('product-card-link').first();
    await firstCard.waitFor({ timeout: 12000 });
    const href = await firstCard.getAttribute('href');
    expect(href).toMatch(/\/catalog\/.+/);
    await firstCard.click();
    await expect(page).toHaveURL(/\/catalog\/.+/);
    // Product detail must show add-to-cart
    await expect(page.getByTestId('add-to-cart')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('catalog / search', () => {
  test('search route renders results or empty state', async ({ page }) => {
    await page.goto('/search?q=product');
    await expect(
      page.getByTestId('search-results').or(page.getByText(/sin resultados/i).or(page.getByText(/0 resultado/i)))
    ).toBeVisible({ timeout: 12000 });
  });
});

test.describe('catalog / categories', () => {
  test('categories page loads category tree or empty state', async ({ page }) => {
    await page.goto('/categories');
    await expect(
      page.getByTestId('category-tree').or(page.getByText(/sin categorias/i))
    ).toBeVisible({ timeout: 12000 });
  });

  test('category link navigates to catalog filtered by category', async ({ page }) => {
    await page.goto('/categories');
    const firstLink = page.getByTestId('category-tree').locator('a').first();
    const count = await firstLink.count();
    if (count === 0) {
      test.skip(); // No categories seeded
      return;
    }
    await firstLink.click();
    await expect(page).toHaveURL(/\/catalog\?category=/);
  });
});

test.describe('catalog / product questions and reviews', () => {
  test('product questions page renders', async ({ page }) => {
    // Navigate to a product first to get a valid productId
    await page.goto('/catalog');
    const firstCard = page.getByTestId('product-card-link').first();
    await firstCard.waitFor({ timeout: 12000 });
    const href = await firstCard.getAttribute('href');
    // Extract slug from /catalog/<slug>
    const slug = href.split('/catalog/')[1];
    // The questions route uses productId — try by slug first, then skip if 404
    await page.goto(`/catalog/${slug}/questions`);
    // Should load or redirect — not throw unhandled error
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 8000 });
  });

  test('product reviews page renders', async ({ page }) => {
    await page.goto('/catalog');
    const firstCard = page.getByTestId('product-card-link').first();
    await firstCard.waitFor({ timeout: 12000 });
    const href = await firstCard.getAttribute('href');
    const slug = href.split('/catalog/')[1];
    await page.goto(`/catalog/${slug}/reviews`);
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 8000 });
  });
});
