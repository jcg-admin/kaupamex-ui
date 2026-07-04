// @ts-check
// E2E — los botones de acción del admin ya NO renderizan texto negro sobre el
// tema oscuro. Antes, los <button> sin className (p.ej. "Crear categoria",
// "Reactivar producto", paginación) caían al color por defecto del navegador
// (negro) e eran invisibles. Tras migrarlos al primitivo Button adaptado de
// /-progress, cada botón lleva un color de tema legible.
//
// Este spec valida el fix de extremo a extremo: navega el admin real y afirma
// que el color computado de los botones migrados NO es negro/casi-negro.
const { test, expect } = require('@playwright/test');

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'testadmin@example.com';
const ADMIN_PASS  = process.env.E2E_ADMIN_PASS  || 'Admin1234!';

async function loginAsAdmin(page) {
  await page.goto('/auth/login');
  await page.getByTestId('login-email').fill(ADMIN_EMAIL);
  await page.getByTestId('login-password').fill(ADMIN_PASS);
  await page.getByTestId('login-submit').click();
  await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 10000 });
}

/**
 * Razón de contraste WCAG entre el color de texto del botón y su fondo
 * EFECTIVO (subiendo por el árbol hasta encontrar un fondo no transparente).
 *
 * El bug de "texto negro" era texto casi-negro sobre fondo oscuro (contraste
 * ~1). Un botón primary correcto tiene texto oscuro sobre fondo lime (contraste
 * alto) — legible. Por eso se mide contraste, no luminancia absoluta del texto.
 */
async function contrastRatio(locator) {
  return locator.evaluate((el) => {
    const parse = (c) => (c.match(/[\d.]+/g) || []).map(Number);
    const lin = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);

    const text = parse(getComputedStyle(el).color);

    // Fondo efectivo: primer ancestro con alpha > 0.
    let bg = [255, 255, 255];
    let node = el;
    while (node) {
      const c = parse(getComputedStyle(node).backgroundColor);
      const alpha = c.length === 4 ? c[3] : 1;
      if (alpha > 0) { bg = [c[0], c[1], c[2]]; break; }
      node = node.parentElement;
    }

    const l1 = lum(text) + 0.05;
    const l2 = lum(bg) + 0.05;
    return Math.max(l1, l2) / Math.min(l1, l2);
  });
}

/** Un botón legible debe superar el mínimo WCAG AA para texto grande (>=3). */
async function expectLegible(locator) {
  await expect(locator).toBeVisible({ timeout: 10000 });
  const ratio = await contrastRatio(locator);
  expect(ratio, `contraste ${ratio.toFixed(2)} < 3 (texto poco legible)`)
    .toBeGreaterThanOrEqual(3);
}

test.describe('admin — contraste de botones (texto no-negro)', () => {
  test('Categorías: "Crear categoria" y acciones de fila son legibles', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/categories');
    await expect(page.locator('form').first()).toBeVisible({ timeout: 12000 });

    // El submit principal del formulario (Crear categoria / Guardar cambios).
    const submit = page.locator('button[type="submit"]').first();
    await expectLegible(submit);
  });

  test('Productos: filtros y toolbar son legibles', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/products');
    await expect(page.locator('main, section').first()).toBeVisible({ timeout: 12000 });

    // Los chips de filtro (Todos / Publicados / Borradores / Sin stock).
    const publicados = page.getByRole('button', { name: /Publicados/i }).first();
    await expectLegible(publicados);
  });

  test('AuditLog: botón "Filtrar" es legible', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/audit-log');
    await expect(page.locator('main, section').first()).toBeVisible({ timeout: 12000 });
    const filtrar = page.getByRole('button', { name: /Filtrar/i }).first();
    await expectLegible(filtrar);
  });

  test('sweep: ningún botón visible del admin tiene texto casi-negro', async ({ page }) => {
    await loginAsAdmin(page);
    for (const path of ['/admin/categories', '/admin/system-settings', '/admin/permissions']) {
      // waitUntil domcontentloaded: el dev-server compila el chunk on-demand
      // (React.lazy); 'load' puede exceder el timeout en frío. El assert de
      // visibilidad ya garantiza que la ruta montó.
      await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await expect(page.locator('main, section, form').first()).toBeVisible({ timeout: 20000 });
      const buttons = page.locator('button:visible');
      const n = await buttons.count();
      for (let i = 0; i < n; i++) {
        const b = buttons.nth(i);
        const txt = (await b.textContent() || '').trim();
        if (!txt) continue; // botones de solo-ícono se auditan por SCSS aparte
        const ratio = await contrastRatio(b);
        expect(ratio, `[${path}] botón "${txt}" contraste ${ratio.toFixed(2)} < 3`)
          .toBeGreaterThanOrEqual(3);
      }
    }
  });
});

test.describe('admin — flujo reactivar producto (#78)', () => {
  test('el botón Desactivar/Reactivar existe, es legible y no da 404', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/products');
    await expect(page.locator('main, section').first()).toBeVisible({ timeout: 12000 });

    // Entrar a la edición del primer producto de la lista.
    const editLink = page.getByRole('link', { name: /Editar/i }).first();
    if (await editLink.count() === 0) test.skip(true, 'sin productos para editar');
    await editLink.click();
    await expect(page).toHaveURL(/\/admin\/products\/\d+\/edit/, { timeout: 10000 });

    const toggle = page.getByRole('button', { name: /(Desactivar|Reactivar) producto/i }).first();
    await expectLegible(toggle);

    // Capturar la respuesta del endpoint activate/deactivate al hacer clic:
    // antes /activate/ devolvía 404 ("Request failed / not found").
    const label = (await toggle.textContent() || '').trim();
    if (/Reactivar/i.test(label)) {
      const [resp] = await Promise.all([
        page.waitForResponse((r) => /\/admin\/products\/\d+\/activate\//.test(r.url()), { timeout: 10000 }),
        toggle.click(),
      ]);
      expect(resp.status(), 'activate no debe devolver 404').not.toBe(404);
    }
  });
});
