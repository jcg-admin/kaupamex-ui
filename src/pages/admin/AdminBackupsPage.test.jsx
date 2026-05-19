/**
 * Tests — AdminBackupsPage (UC-ADM-05)
 *
 *   GET  /api/v1/admin/backups/
 *   POST /api/v1/admin/backups/trigger/
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import backupsReducer from '@redux/slices/backupsSlice';
import AdminBackupsPage from './AdminBackupsPage';

const BACKUPS = [
  { id: 1, created_at: '2026-05-19T03:00:00Z', type: 'AUTO',   size_bytes: 12_582_912, status: 'COMPLETED', download_url: '/downloads/backup-1.tar.gz' },
  { id: 2, created_at: '2026-05-18T03:00:00Z', type: 'MANUAL', size_bytes: 11_184_640, status: 'COMPLETED', download_url: null },
];

const wrap = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const store = configureStore({ reducer: { backups: backupsReducer } });
  return (
    <QueryClientProvider client={client}>
      <Provider store={store}>
        <AdminBackupsPage />
      </Provider>
    </QueryClientProvider>
  );
};

afterEach(() => jest.clearAllMocks());

describe('AdminBackupsPage (UC-ADM-05)', () => {
  it('muestra el listado de backups', async () => {
    apiService.get.mockResolvedValue({ data: { results: BACKUPS } });
    render(wrap());
    expect(await screen.findByRole('heading', { name: /Backups/i })).toBeInTheDocument();
    expect(await screen.findByText('AUTO')).toBeInTheDocument();
    expect(screen.getByText('MANUAL')).toBeInTheDocument();
  });

  it('dispara backup manual via POST /api/v1/admin/backups/trigger/', async () => {
    apiService.get.mockResolvedValue({ data: { results: BACKUPS } });
    apiService.post.mockResolvedValue({ data: { ok: true } });
    render(wrap());
    await screen.findByText('AUTO');

    fireEvent.click(screen.getByRole('button', { name: /Generar backup ahora/i }));
    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/admin/backups/trigger/',
      );
    });
  });
});
