// Smoke E2E full-stack: login -> catalogo -> carrito -> checkout.
//
// Cruza las tres capas reales: db (sembrada por socket, perfil deploy) +
// api (runserver) + ui (navegador). Es la unica capa que ejerce el
// contrato api<->ui en un navegador real; jest aislado no lo cruza
// (de hecho jest enmascaro el bug de rutas /carrito -> 404, ver
// hallazgos-rutas-ui-espanol-rotas). Iniciativa: implementar-e2e-navegador.
//
// Auth: el access token vive en MEMORIA del modulo apiService (DEC-AUTH-2),
// no en localStorage/cookie; por eso el login se hace por formulario aqui
// (Playwright storageState no restauraria la sesion). Ver ADR-FE-004 v1.1.0,
// precision 2.
//
// Credenciales: usuario del seed QA, que crea `kaupamex-bin
// create_seed_users` en api (la base la provisiona db). Ajustar via
// E2E_EMAIL / E2E_PASSWORD a un usuario realmente sembrado — los defaults
// son placeholders.
const { test, expect } = require('@playwright/test');

const EMAIL = process.env.E2E_EMAIL || 'buyer@e-commerce.test';
const PASSWORD = process.env.E2E_PASSWORD || 'Test1234!';

test('smoke: login -> catalogo -> carrito -> checkout', async ({ page }) => {
  // 1) Login por formulario (JWT en memoria del modulo).
  await page.goto('/auth/login');
  await page.getByTestId('login-email').fill(EMAIL);
  await page.getByTestId('login-password').fill(PASSWORD);
  await page.getByTestId('login-submit').click();
  await expect(page).not.toHaveURL(/\/auth\/login$/); // salio del login

  // 2) Catalogo -> primer producto.
  await page.goto('/catalog');
  await page.getByTestId('product-card-link').first().click();
  await expect(page).toHaveURL(/\/catalog\/.+/);

  // 3) Agregar a la bolsa -> navega a /cart.
  await page.getByTestId('add-to-cart').click();
  await expect(page).toHaveURL(/\/cart$/);

  // 4) Continuar al checkout (ruta protegida; usa la sesion del paso 1).
  await page.getByTestId('cart-checkout').click();
  await expect(page).toHaveURL(/\/checkout$/);

  // 5) Entregable dia uno: checkout cargado con el flujo vivo de extremo a
  //    extremo. Completar "Confirmar y pagar" (direccion + gateway sandbox)
  //    queda para un spec posterior.
  await expect(page.getByTestId('checkout-submit')).toBeVisible();
});
