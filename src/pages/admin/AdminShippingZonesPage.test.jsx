/**
 * Tests — AdminShippingZonesPage (H-12)
 * Catálogo de zonas de envío + tiempos de entrega.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockZones = [
  { id: 1, name: 'Guadalajara', zip_code_prefix: '44', estimated_days_min: 2, estimated_days_max: 4, cost: '89.00', is_active: true },
];

jest.mock('@hooks/domain/useShippingZones', () => ({
  __esModule: true,
  SHIPPING_ZONES_QUERY_KEY: ['admin-shipping-zones'],
  useShippingZones: () => ({ data: mockZones, isLoading: false, isError: false }),
  default: () => ({ data: mockZones, isLoading: false, isError: false }),
}));

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { post: jest.fn().mockResolvedValue({}), patch: jest.fn().mockResolvedValue({}), delete: jest.fn().mockResolvedValue({}) },
}));

import apiService from '@services/apiService';
import AdminShippingZonesPage from './AdminShippingZonesPage';

const wrap = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <AdminShippingZonesPage />
    </QueryClientProvider>
  );
};

describe('AdminShippingZonesPage (H-12)', () => {
  it('lista las zonas con su ventana de entrega', () => {
    render(wrap());
    expect(screen.getByText('Guadalajara')).toBeInTheDocument();
    expect(screen.getByText('2–4 días')).toBeInTheDocument();
  });

  it('valida que el máximo no sea menor que el mínimo', () => {
    render(wrap());
    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'CDMX' } });
    fireEvent.change(screen.getByLabelText(/Prefijo CP/), { target: { value: '01' } });
    fireEvent.change(screen.getByLabelText(/Días mín/), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/Días máx/), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /Crear zona/ }));
    expect(screen.getByText(/no puede ser menor que el mínimo/)).toBeInTheDocument();
    expect(apiService.post).not.toHaveBeenCalled();
  });

  it('crea una zona válida vía apiService.post', async () => {
    render(wrap());
    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'CDMX' } });
    fireEvent.change(screen.getByLabelText(/Prefijo CP/), { target: { value: '01' } });
    fireEvent.change(screen.getByLabelText(/Días mín/), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Días máx/), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: /Crear zona/ }));
    await waitFor(() => expect(apiService.post).toHaveBeenCalledWith(
      '/api/v2/admin/shipping-zones/',
      expect.objectContaining({ name: 'CDMX', zip_code_prefix: '01', estimated_days_min: 1, estimated_days_max: 3 }),
    ));
  });
});
