/**
 * Tests — AdminSystemSettingsPage (UC-ADM-04)
 *
 *   GET   /api/v1/admin/settings/
 *   PATCH /api/v1/admin/settings/
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), patch: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import settingsReducer from '@redux/slices/settingsSlice';
import AdminSystemSettingsPage from './AdminSystemSettingsPage';

const SETTINGS = {
  site_name: 'PracticaYoruba',
  contact_email: 'hola@yoruba.mx',
  support_phone: '+52 55 0000 0000',
  tax_rate: 16,
  currency: 'MXN',
  maintenance_mode: false,
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

afterEach(() => jest.clearAllMocks());

describe('AdminSystemSettingsPage (UC-ADM-04)', () => {
  it('carga los settings actuales', async () => {
    apiService.get.mockResolvedValue({ data: SETTINGS });
    render(wrap());
    expect(
      await screen.findByRole('heading', { name: /Configuracion del Sistema/i }),
    ).toBeInTheDocument();
    expect(await screen.findByDisplayValue('PracticaYoruba')).toBeInTheDocument();
    expect(screen.getByDisplayValue('hola@yoruba.mx')).toBeInTheDocument();
  });

  it('envia PATCH /api/v1/admin/settings/ con los cambios', async () => {
    apiService.get.mockResolvedValue({ data: SETTINGS });
    apiService.patch.mockResolvedValue({ data: SETTINGS });

    render(wrap());
    const input = await screen.findByDisplayValue('PracticaYoruba');
    fireEvent.change(input, { target: { value: 'PracticaYoruba MX' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    await waitFor(() => {
      expect(apiService.patch).toHaveBeenCalledWith(
        '/api/v1/admin/settings/',
        expect.objectContaining({ site_name: 'PracticaYoruba MX' }),
      );
    });
  });
});
