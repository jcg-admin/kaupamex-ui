import { http, HttpResponse } from 'msw';

const BASE = process.env.API_URL || 'http://localhost:8000';

// DEC-08/09 (party/authz): menú admin dinámico + capacidades del usuario
// (api@c359164). Handler base: 401 (sin sesión en jsdom) — useAdminMenu
// degrada al ADMIN_NAV estático, que es el comportamiento previo. Los tests
// que ejercitan el menú dinámico sobreescriben con server.use(...).
export const authzHandlers = [
  http.get(`${BASE}/api/v2/authz/me/menu/`, () =>
    HttpResponse.json({ detail: 'Auth requerida.' }, { status: 401 }),
  ),
  http.get(`${BASE}/api/v2/authz/me/capabilities/`, () =>
    HttpResponse.json({ detail: 'Auth requerida.' }, { status: 401 }),
  ),
];
