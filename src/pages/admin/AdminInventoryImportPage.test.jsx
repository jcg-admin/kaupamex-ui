/**
 * Tests — AdminInventoryImportPage
 * UC-INV-05: Importar productos desde CSV.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import inventoryReducer from '@redux/slices/inventorySlice';
import AdminInventoryImportPage from './AdminInventoryImportPage';

const makeStore = () =>
  configureStore({ reducer: { inventory: inventoryReducer } });

const wrap = (ui, store) => (
  <Provider store={store}>
    <MemoryRouter>{ui}</MemoryRouter>
  </Provider>
);

afterEach(() => jest.clearAllMocks());

describe('AdminInventoryImportPage (UC-INV-05)', () => {
  it('muestra el titulo y la descripcion del proceso', () => {
    render(wrap(<AdminInventoryImportPage />, makeStore()));
    expect(
      screen.getByRole('heading', { name: /Importar productos desde CSV/i }),
    ).toBeInTheDocument();
  });

  it('ofrece un input de archivo y un boton para enviar', () => {
    render(wrap(<AdminInventoryImportPage />, makeStore()));
    expect(screen.getByLabelText(/Archivo CSV/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Importar/i })).toBeInTheDocument();
  });

  it('boton importar deshabilitado si no hay archivo seleccionado', () => {
    render(wrap(<AdminInventoryImportPage />, makeStore()));
    expect(screen.getByRole('button', { name: /Importar/i })).toBeDisabled();
  });

  it('al subir un CSV y enviar, hace POST al endpoint con FormData', async () => {
    apiService.post.mockResolvedValue({
      data: {
        products_created: 5, products_failed: 1,
        error_report: [{ row: 3, field: 'sku', reason: 'duplicado' }],
        download_url: '/media/reports/import-456.csv',
      },
    });
    render(wrap(<AdminInventoryImportPage />, makeStore()));
    const file = new File(['sku,name,base_price,category_slug\nA1,Vela,10,vela'],
      'productos.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByLabelText(/Archivo CSV/i),
      { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /Importar/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/admin/inventory/import/',
        expect.any(FormData),
      );
    });
  });

  it('muestra el reporte con productos creados y fallados tras un import exitoso', async () => {
    apiService.post.mockResolvedValue({
      data: {
        products_created: 5, products_failed: 1,
        error_report: [{ row: 3, field: 'sku', reason: 'duplicado' }],
        download_url: '/media/reports/import-456.csv',
      },
    });
    render(wrap(<AdminInventoryImportPage />, makeStore()));
    const file = new File(['x'], 'a.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByLabelText(/Archivo CSV/i),
      { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /Importar/i }));

    expect(await screen.findByText(/5 productos creados/i)).toBeInTheDocument();
    expect(screen.getByText(/1 productos fallidos/i)).toBeInTheDocument();
    expect(screen.getByText(/duplicado/i)).toBeInTheDocument();
  });

  it('muestra error si el backend rechaza con ENCABEZADO_CSV_INVALIDO', async () => {
    apiService.post.mockRejectedValue({
      body: { detail: 'ENCABEZADO_CSV_INVALIDO' }, message: '422',
    });
    render(wrap(<AdminInventoryImportPage />, makeStore()));
    const file = new File(['x'], 'bad.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByLabelText(/Archivo CSV/i),
      { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /Importar/i }));

    expect(
      await screen.findByText(/ENCABEZADO_CSV_INVALIDO/i),
    ).toBeInTheDocument();
  });

  it('muestra un enlace para volver al inventario', () => {
    render(wrap(<AdminInventoryImportPage />, makeStore()));
    expect(screen.getByRole('link', { name: /Volver al inventario/i }))
      .toBeInTheDocument();
  });
});
