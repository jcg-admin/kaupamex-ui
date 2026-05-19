/**
 * Tests — AdminReturnDetailPage
 * UC-RET-02: Revisar solicitud (aprobar / rechazar / solicitar info)
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import returnsReducer from '@redux/slices/returnsSlice';
import AdminReturnDetailPage from './AdminReturnDetailPage';

const makeStore = () =>
  configureStore({ reducer: { returns: returnsReducer } });

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (ui, store, initial = '/admin/returns/300') => (
  <Provider store={store}>
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route path="/admin/returns/:id" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  </Provider>
);

const PENDING_RETURN = {
  id: 300,
  order_id: 'ORD-300',
  status: 'PENDIENTE_REVISION',
  reason: 'PRODUCTO_DANADO',
  description: 'Producto recibido con un golpe en el empaque',
  created_at: '2026-05-10T10:00:00Z',
  customer: { id: 5, email: 'demo@test.mx', name: 'Demo Yoruba' },
  items: [
    { id: 1, product_name: 'Collar Oshun', quantity: 1, price: 1250 },
  ],
};

afterEach(() => jest.clearAllMocks());

describe('AdminReturnDetailPage (UC-RET-02)', () => {
  it('carga el detalle admin por id desde la URL', async () => {
    apiService.get.mockResolvedValue({ data: PENDING_RETURN });
    render(wrap(<AdminReturnDetailPage />, makeStore()));

    await screen.findByText(/Devoluci.n #300/);
    expect(apiService.get).toHaveBeenCalledWith(
      expect.stringContaining('/admin/returns/300/'),
      expect.anything(),
    );
  });

  it('muestra los datos del comprador y de la orden', async () => {
    apiService.get.mockResolvedValue({ data: PENDING_RETURN });
    render(wrap(<AdminReturnDetailPage />, makeStore()));
    expect(await screen.findByText('demo@test.mx')).toBeInTheDocument();
    expect(screen.getByText('ORD-300')).toBeInTheDocument();
    expect(screen.getByText('Collar Oshun')).toBeInTheDocument();
  });

  it('aprueba la solicitud al confirmar el formulario', async () => {
    apiService.get.mockResolvedValue({ data: PENDING_RETURN });
    apiService.post.mockResolvedValue({
      data: { ...PENDING_RETURN, status: 'APROBADA' },
    });

    render(wrap(<AdminReturnDetailPage />, makeStore()));
    await screen.findByText(/Devoluci.n #300/);

    fireEvent.change(screen.getByLabelText(/Justificaci/i),
      { target: { value: 'Daño confirmado por fotos' } });
    fireEvent.click(screen.getByRole('button', { name: /^Aprobar$/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        expect.stringContaining('/admin/returns/300/approve/'),
        expect.objectContaining({ justification: 'Daño confirmado por fotos' }),
      );
    });
  });

  it('rechaza la solicitud con justificacion', async () => {
    apiService.get.mockResolvedValue({ data: PENDING_RETURN });
    apiService.post.mockResolvedValue({
      data: { ...PENDING_RETURN, status: 'RECHAZADA' },
    });

    render(wrap(<AdminReturnDetailPage />, makeStore()));
    await screen.findByText(/Devoluci.n #300/);

    fireEvent.change(screen.getByLabelText(/Justificaci/i),
      { target: { value: 'Plazo de devolución vencido' } });
    fireEvent.click(screen.getByRole('button', { name: /^Rechazar$/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        expect.stringContaining('/admin/returns/300/reject/'),
        expect.objectContaining({ justification: 'Plazo de devolución vencido' }),
      );
    });
  });

  it('solicita información adicional al comprador', async () => {
    apiService.get.mockResolvedValue({ data: PENDING_RETURN });
    apiService.post.mockResolvedValue({
      data: { ...PENDING_RETURN, status: 'PENDIENTE_INFORMACION' },
    });

    render(wrap(<AdminReturnDetailPage />, makeStore()));
    await screen.findByText(/Devoluci.n #300/);

    fireEvent.change(screen.getByLabelText(/Justificaci/i),
      { target: { value: 'Por favor envía fotos adicionales del daño.' } });
    fireEvent.click(screen.getByRole('button', { name: /Solicitar informaci/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        expect.stringContaining('/admin/returns/300/request-info/'),
        expect.objectContaining({ message: expect.stringMatching(/fotos adicionales/i) }),
      );
    });
  });

  it('exige justificacion antes de aprobar o rechazar', async () => {
    apiService.get.mockResolvedValue({ data: PENDING_RETURN });
    render(wrap(<AdminReturnDetailPage />, makeStore()));
    await screen.findByText(/Devoluci.n #300/);

    fireEvent.click(screen.getByRole('button', { name: /^Aprobar$/i }));
    expect(screen.getByText(/La justificación es obligatoria/i)).toBeInTheDocument();
    expect(apiService.post).not.toHaveBeenCalled();
  });
});
