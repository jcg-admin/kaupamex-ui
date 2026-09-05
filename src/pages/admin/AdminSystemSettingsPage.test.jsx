/**
 * Tests — AdminSystemSettingsPage (UC-ADM-04)
 *
 *   GET   /api/v2/admin/settings/
 *   PATCH /api/v2/admin/settings/
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

const BASE = process.env.API_URL || 'http://localhost:8000';

import settingsReducer from '@redux/slices/settingsSlice';
import AdminSystemSettingsPage from './AdminSystemSettingsPage';

// H-CICLO40-08: claves alineadas con SiteSettingsAdminSerializer.
// contact_email → support_email; support_phone → phone; tax_rate → iva_rate.
const SETTINGS = {
  site_name:     'Kaupamex',
  support_email: 'hola@yoruba.mx',
  phone:         '+52 55 0000 0000',
  iva_rate:      16,
  currency:      'MXN',
};

const wrap = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const store = configureStore({ reducer: { settings: settingsReducer } });
  return (
    <QueryClientProvider client={client}>
      <Provider store={store}>
        <AdminSystemSettingsPage />
      </Provider>
    </QueryClientProvider>
  );
};

describe('AdminSystemSettingsPage (UC-ADM-04)', () => {
  it('carga los settings actuales', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/settings/`, () => HttpResponse.json(SETTINGS)),
    );
    render(wrap());
    expect(
      await screen.findByRole('heading', { name: /Configuracion del Sistema/i }),
    ).toBeInTheDocument();
    expect(await screen.findByDisplayValue('Kaupamex')).toBeInTheDocument();
    expect(screen.getByDisplayValue('hola@yoruba.mx')).toBeInTheDocument();
  });

  it('envia PATCH /api/v2/admin/settings/ con los cambios', async () => {
    let patchBody;
    server.use(
      http.get(`${BASE}/api/v2/admin/settings/`, () => HttpResponse.json(SETTINGS)),
      http.patch(`${BASE}/api/v2/admin/settings/`, async ({ request }) => {
        patchBody = await request.json();
        return HttpResponse.json(SETTINGS);
      }),
    );

    render(wrap());
    const input = await screen.findByDisplayValue('Kaupamex');
    fireEvent.change(input, { target: { value: 'Kaupamex MX' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    await waitFor(() => {
      expect(patchBody).toMatchObject({ site_name: 'Kaupamex MX' });
    });
  });
});
