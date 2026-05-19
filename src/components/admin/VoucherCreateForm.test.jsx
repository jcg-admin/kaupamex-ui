/**
 * Tests — VoucherCreateForm
 * UC-PRO-01: Crear voucher (Admin)
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import vouchersReducer from '@redux/slices/vouchersSlice';
import VoucherCreateForm from './VoucherCreateForm';

const makeStore = () =>
  configureStore({ reducer: { vouchers: vouchersReducer } });

const wrap = (ui, store) => <Provider store={store}>{ui}</Provider>;

afterEach(() => jest.clearAllMocks());

describe('VoucherCreateForm (UC-PRO-01)', () => {
  it('renderiza el dialogo con campos de codigo, tipo y valor', () => {
    render(wrap(<VoucherCreateForm onClose={() => {}} />, makeStore()));
    expect(screen.getByRole('dialog', { name: /Nuevo cupon/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Codigo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tipo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Valor/i)).toBeInTheDocument();
  });

  it('valida codigo obligatorio', () => {
    render(wrap(<VoucherCreateForm onClose={() => {}} />, makeStore()));
    fireEvent.click(screen.getByRole('button', { name: /Crear cupon/i }));
    expect(screen.getByText(/El codigo es obligatorio/i)).toBeInTheDocument();
    expect(apiService.post).not.toHaveBeenCalled();
  });

  it('valida porcentaje entre 0 y 100', () => {
    render(wrap(<VoucherCreateForm onClose={() => {}} />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Codigo/i), {
      target: { value: 'TEST10' },
    });
    fireEvent.change(screen.getByLabelText(/Tipo/i), {
      target: { value: 'PERCENT' },
    });
    fireEvent.change(screen.getByLabelText(/Valor/i), {
      target: { value: '150' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Crear cupon/i }));
    expect(screen.getByText(/entre 0 y 100/i)).toBeInTheDocument();
    expect(apiService.post).not.toHaveBeenCalled();
  });

  it('valida que el valor fijo sea mayor a 0', () => {
    render(wrap(<VoucherCreateForm onClose={() => {}} />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Codigo/i), {
      target: { value: 'TEST10' },
    });
    fireEvent.change(screen.getByLabelText(/Tipo/i), {
      target: { value: 'FIXED' },
    });
    fireEvent.change(screen.getByLabelText(/Valor/i), {
      target: { value: '0' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Crear cupon/i }));
    expect(screen.getByText(/mayor a 0/i)).toBeInTheDocument();
  });

  it('envia el voucher al backend en el happy path', async () => {
    apiService.post.mockResolvedValue({
      data: { id: 99, code: 'WELCOME20', type: 'PERCENT', value: 20, is_active: true },
    });

    render(wrap(<VoucherCreateForm onClose={() => {}} />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Codigo/i),
      { target: { value: 'WELCOME20' } });
    fireEvent.change(screen.getByLabelText(/Tipo/i),
      { target: { value: 'PERCENT' } });
    fireEvent.change(screen.getByLabelText(/Valor/i),
      { target: { value: '20' } });

    fireEvent.click(screen.getByRole('button', { name: /Crear cupon/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        expect.stringContaining('/admin/vouchers/'),
        expect.objectContaining({
          code: 'WELCOME20',
          type: 'PERCENT',
          value: 20,
        }),
      );
    });
  });

  it('llama a onClose al pulsar Cancelar', () => {
    const onClose = jest.fn();
    render(wrap(<VoucherCreateForm onClose={onClose} />, makeStore()));
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
