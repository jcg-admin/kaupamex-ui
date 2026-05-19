/**
 * Tests de integracion — AdminLayout sidebar navigation
 *
 * Verifica que las entradas del sidebar a /admin/logistics (P-09) y
 * /admin/config (P-10) ahora resuelven a paginas reales y no a 404.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

import apiService from '@services/apiService';
import authReducer       from '@redux/slices/authSlice';
import uiReducer         from '@redux/slices/uiSlice';
import logisticsReducer  from '@redux/slices/logisticsSlice';
import AdminLayout       from './AdminLayout';
import AdminLogisticsPage from '@pages/admin/AdminLogisticsPage';
import AdminConfigPage    from '@pages/admin/AdminConfigPage';

function buildStore() {
  return configureStore({
    reducer: {
      auth:      authReducer,
      ui:        uiReducer,
      logistics: logisticsReducer,
    },
    preloadedState: {
      auth: {
        isAuthenticated: true,
        user: { id: 1, email: 'admin@yoruba.mx', first_name: 'Ada', last_name: 'L', is_staff: true },
        isLoading: false,
        error: null,
      },
      ui: { isSidebarOpen: false, isDarkMode: false, isSearchOpen: false, activeModal: null, modalProps: {}, toasts: [] },
    },
  });
}

function renderApp(initialRoute = '/admin') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <Provider store={buildStore()}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route element={<AdminLayout />}>
              <Route path="/admin"            element={<div>Dashboard placeholder</div>} />
              <Route path="/admin/logistics"  element={<AdminLogisticsPage />} />
              <Route path="/admin/config"     element={<AdminConfigPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

afterEach(() => jest.clearAllMocks());

describe('AdminLayout sidebar — P-09 + P-10 cierre', () => {
  it('navega de Dashboard a /admin/logistics y renderiza la pagina (no 404)', async () => {
    apiService.get.mockResolvedValue({ data: { group_a: [], group_b: [] } });
    renderApp('/admin');

    fireEvent.click(screen.getByRole('link', { name: /^Log(í|i)stica$/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /^Logistica$/i, level: 1 }),
      ).toBeInTheDocument();
    });
  });

  it('navega de Dashboard a /admin/config y renderiza el hub (no 404)', async () => {
    renderApp('/admin');

    fireEvent.click(screen.getByRole('link', { name: /^Configuraci(ó|o)n$/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /^Configuracion$/i, level: 1 }),
      ).toBeInTheDocument();
    });
  });
});
