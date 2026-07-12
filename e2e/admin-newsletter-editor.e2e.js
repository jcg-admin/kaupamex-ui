// @ts-check
/**
 * E2E — AdminNewsletterComposePage editor de contenido (SOL-011, RichTextEditor)
 *
 * El campo "Contenido HTML" del compositor de campañas (UC-NEW-04) usa el
 * RichTextEditor nativo (contentEditable + toolbar + dompurify), no un textarea.
 * Navega a /admin/newsletter/compose, confirma que la toolbar de formato y el
 * área editable (role=textbox) están presentes, teclea contenido y verifica que
 * la "Vista previa" lo refleja sanitizado. Captura evidencia visual en
 * e2e/artifacts/.
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

test.describe('admin newsletter / editor de contenido', () => {
  test('el campo HTML usa el RichTextEditor con toolbar y vista previa', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/newsletter/compose');

    await expect(page.getByRole('heading', { name: /Nueva campa[nñ]a/i })).toBeVisible({ timeout: 12000 });

    // La toolbar de formato y el área editable están presentes (no un textarea).
    await expect(page.getByRole('button', { name: /Negrita/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Insertar enlace/i })).toBeVisible();
    const editor = page.getByLabel('Contenido HTML');
    await expect(editor).toBeVisible();
    await expect(editor).toHaveAttribute('contenteditable', 'true');

    // Teclear contenido → la vista previa lo refleja.
    await editor.click();
    await page.keyboard.type('Boletin de julio');
    const preview = page.getByLabel('Vista previa del contenido');
    await expect(preview).toContainText('Boletin de julio');

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'admin-newsletter-editor.png'), fullPage: true });
  });
});
