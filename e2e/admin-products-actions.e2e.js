// @ts-check
/**
 * E2E — AdminProductsPage acciones de fila (SOL-011, DropDownButton)
 *
 * La columna de acciones de la tabla de productos consolida las tres acciones
 * por fila (Destacar / Editar / Eliminar) en un único menú "kebab" (⋮) nativo
 * (DropDownButton). Navega a /admin/products, abre el kebab de la primera fila,
 * confirma que aparecen las tres acciones en un role=menu y captura evidencia
 * visual (screenshot) en e2e/artifacts/.
 *
 * Nota: el verde autoritativo del screenshot es WSL (L-010); Chromium ya está
 * instalado en el contenedor pero la pila completa (app + api sembrada) es la
 * que da la evidencia curada.
 */
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'testadmin@example.com';
const ADMIN_PASS  = process.env.E2E_ADMIN_PASS  || 'Admin1234!';

const ARTIFACTS_DIR = path.join(__dirname, 'artifacts');

/** Login with an is_staff=true user. */
async function loginAsAdmin(page) {
  await page.goto('/auth/login');
  await page.getByTestId('login-email').fill(ADMIN_EMAIL);
  await page.getByTestId('login-password').fill(ADMIN_PASS);
  await page.getByTestId('login-submit').click();
  await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 10000 });
}

test.describe('admin products / kebab de acciones', () => {
  test('la fila agrupa Destacar/Editar/Eliminar en un menu kebab', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/products');

    await expect(page.getByRole('heading', { name: /Productos/i })).toBeVisible({ timeout: 12000 });
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });

    // La evidencia debe probar una pantalla QUE FUNCIONA, no una rota.
    await expect(page.getByText(/No se pudieron cargar los productos/i)).toHaveCount(0);

    // Disparador kebab de la primera fila (aria-label "Acciones de <nombre>").
    const trigger = page.getByRole('button', { name: /^Acciones de/ }).first();
    await expect(trigger).toBeVisible({ timeout: 10000 });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // Al abrir, el menú muestra las tres acciones consolidadas.
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const menu = page.getByRole('menu');
    await expect(menu.getByRole('menuitem', { name: /Destacar|Quitar destacado/ })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Editar' })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Eliminar' })).toBeVisible();

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'admin-products-actions.png'), fullPage: true });

    // Escape cierra el menú (patrón popup del DropDownButton).
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
  });
});
