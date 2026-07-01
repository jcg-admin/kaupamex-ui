import { http, HttpResponse } from 'msw';
import { makeUser } from '../factories/user';

const BASE = process.env.API_URL || 'http://localhost:8000';

export const authHandlers = [
  http.post(`${BASE}/api/v2/auth/login/`, async ({ request }) => {
    const body = await request.json();
    if (!body.username || !body.password) {
      return HttpResponse.json(
        { codigo_error: 'CREDENCIALES_INVALIDAS', detail: 'Credenciales invalidas' },
        { status: 400 },
      );
    }
    return HttpResponse.json({
      access:  'mock-access-token',
      refresh: 'mock-refresh-token',
      user:    makeUser({ username: body.username }),
    });
  }),

  http.post(`${BASE}/api/v2/auth/logout/`, () =>
    HttpResponse.json({ detail: 'Sesion cerrada' }),
  ),

  http.post(`${BASE}/api/v2/auth/refresh/`, () =>
    HttpResponse.json({ access: 'mock-access-token-refreshed' }),
  ),

  http.get(`${BASE}/api/v2/auth/me/`, () =>
    HttpResponse.json(makeUser()),
  ),

  // ADR-018: estado de sesion de servidor (restauracion tras recarga).
  http.get(`${BASE}/api/v2/auth/session/`, () =>
    HttpResponse.json({
      isAuthenticated: true,
      user: makeUser(),
      csrfToken: 'mock-csrf-token',
    }),
  ),

  http.post(`${BASE}/api/v2/auth/session/logout/`, () =>
    new HttpResponse(null, { status: 204 }),
  ),
];
