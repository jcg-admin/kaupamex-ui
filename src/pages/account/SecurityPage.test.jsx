/**
 * Tests — SecurityPage (UC-AUTH-17 / H-16): sesiones activas reales.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import authReducer from '../../redux/slices/authSlice';
import SecurityPage from './SecurityPage';

const BASE = process.env.API_URL || 'http://localhost:8000';
const LIST_URL = `${BASE}/api/v2/auth/sessions/active/`;

const SESSIONS = [
  { id: 1, ip_address: '1.2.3.4', device: 'Chrome · Windows', last_activity: '2026-07-01T00:00:00Z', is_current: true },
  { id: 2, ip_address: '5.6.7.8', device: 'Safari · iOS',     last_activity: '2026-06-20T00:00:00Z', is_current: false },
];

const wrap = (ui) => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { user: { id: 1 }, isAuthenticated: true } },
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter>{ui}</MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
};

describe('SecurityPage — sesiones activas (H-16)', () => {
  beforeEach(() => {
    server.use(
      http.get(LIST_URL, () =>
        HttpResponse.json({ results: SESSIONS, count: SESSIONS.length }),
      ),
    );
  });

  it('lista las sesiones reales (dispositivo + IP)', async () => {
    render(wrap(<SecurityPage />));
    expect(await screen.findByText('Chrome · Windows')).toBeInTheDocument();
    expect(screen.getByText('Safari · iOS')).toBeInTheDocument();
    expect(screen.getByText('5.6.7.8')).toBeInTheDocument();
    // La sesión actual no ofrece botón de cerrar.
    expect(screen.queryByTestId('session-revoke-1')).toBeNull();
  });

  it('cierra una sesión específica (POST revoke)', async () => {
    let revoked = null;
    server.use(
      http.post(`${BASE}/api/v2/auth/sessions/:id/revoke/`, ({ params }) => {
        revoked = params.id;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    render(wrap(<SecurityPage />));
    const btn = await screen.findByTestId('session-revoke-2');
    fireEvent.click(btn);
    await waitFor(() => expect(revoked).toBe('2'));
  });
});
