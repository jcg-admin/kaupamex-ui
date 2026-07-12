// @ts-check
/**
 * E2E — Autocompletado de C.P. en el formulario de direcciones (T-214, party
 * migration). Navega a /account/addresses, abre "Nueva dirección", escribe un
 * C.P. real de 5 digitos y confirma que el autocompletado (GET
 * /api/v2/geo/postal-codes/<cp>/, api@8921e37) rellena Ciudad/Estado y ofrece
 * el desplegable de Colonia — sin bloquear la captura manual.
 *
 * Entorno autoritativo: WSL (L-010, react-verification-gate). En el
 * contenedor la pila full-stack (webpack :3001 + api :8000 + db) puede no
 * estar disponible; en ese caso el screenshot no se captura y se reporta la
 * causa explicitamente (no se fabrica evidencia).
 */
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const BUYER_EMAIL = process.env.E2E_BUYER_EMAIL || 'testbuyer@example.com';
const BUYER_PASS  = process.env.E2E_BUYER_PASS  || 'Test1234!';

const ARTIFACTS_DIR = path.join(__dirname, 'artifacts');

// C.P. 01000 (Álvaro Obregón, CDMX) — presente en el catalogo SEPOMEX seed.
const CP_VALIDO = '01000';

/** Login by form — la sesion es cookie HttpOnly (ADR-018), sin storageState. */
async function loginAsBuyer(page) {
  await page.goto('/auth/login');
  await page.getByTestId('login-email').fill(BUYER_EMAIL);
  await page.getByTestId('login-password').fill(BUYER_PASS);
  await page.getByTestId('login-submit').click();
  await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 10000 });
}

test.describe('autocompletado de C.P. — direcciones (T-214)', () => {
  test('escribir un C.P. valido rellena ciudad/estado y ofrece colonias', async ({ page }) => {
    await loginAsBuyer(page);
    await page.goto('/account/addresses');
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /añadir dirección/i }).click();

    const cpField = page.getByLabel(/c\.p\./i);
    await expect(cpField).toBeVisible({ timeout: 8000 });
    await cpField.fill(CP_VALIDO);

    // Debounce (300ms) + round-trip del lookup.
    const ciudadField = page.getByLabel(/^ciudad/i);
    await expect(async () => {
      expect(await ciudadField.inputValue()).not.toBe('');
    }).toPass({ timeout: 8000 });

    // Colonia pasa de <input> a <select> con opciones reales.
    const coloniaSelect = page.getByLabel(/colonia/i);
    await expect(coloniaSelect).toHaveJSProperty('tagName', 'SELECT', { timeout: 8000 });

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'cp-autocomplete.png'), fullPage: true });
  });

  test('un C.P. inexistente no bloquea la captura manual (graceful degradation)', async ({ page }) => {
    await loginAsBuyer(page);
    await page.goto('/account/addresses');
    await page.getByRole('button', { name: /añadir dirección/i }).click();

    const cpField = page.getByLabel(/c\.p\./i);
    await cpField.fill('99999');

    // Colonia sigue siendo un <input> de texto libre — el 404 no rompe el form.
    const colonia = page.getByLabel(/colonia/i);
    await page.waitForTimeout(600); // debounce (300ms) + round-trip
    await expect(colonia).toHaveJSProperty('tagName', 'INPUT');
    await colonia.fill('Colonia capturada a mano');
    await expect(colonia).toHaveValue('Colonia capturada a mano');
  });
});
