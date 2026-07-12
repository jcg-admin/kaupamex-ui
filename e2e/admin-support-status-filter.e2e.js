// @ts-check
/**
 * E2E — AdminSupportPage filtro de estado segmentado (SOL-011, SegmentedControl)
 *
 * El filtro de estado de la bandeja de soporte pasó de un <select> a un
 * SegmentedControl nativo donde cada segmento muestra la etiqueta del estado
 * + un badge con el conteo (equivalente a itemTemplate). Navega a
 * /admin/support, confirma los segmentos, elige "Abierto" y captura evidencia.
 *
 * Nota: el verde autoritativo del screenshot es WSL (L-010); Chromium ya está
 * instalado en el contenedor pero la pila completa (app + api sembrada) es la
 * que produce la evidencia curada.
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

test.describe('admin support / filtro de estado segmentado', () => {
  test('el filtro de estado es un SegmentedControl con conteos', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/support');

    await expect(page.getByRole('heading', { name: /Bandeja de soporte/i })).toBeVisible({ timeout: 12000 });

    // La evidencia debe probar una pantalla QUE FUNCIONA, no una rota.
    await expect(page.getByText(/No se pudo cargar la bandeja/i)).toHaveCount(0);

    // Grupo de filtro segmentado (aria-label) con sus segmentos por estado.
    const group = page.getByRole('group', { name: /Filtrar por estado/i });
    await expect(group).toBeVisible({ timeout: 10000 });
    await expect(group.getByRole('button', { name: 'Todos' })).toBeVisible();
    const openSeg = group.getByRole('button', { name: 'Abierto' });
    await expect(openSeg).toBeVisible();

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'admin-support-status-filter.png'), fullPage: true });

    // Elegir "Abierto" marca el segmento como activo (aria-pressed).
    await openSeg.click();
    await expect(openSeg).toHaveAttribute('aria-pressed', 'true');
  });
});
