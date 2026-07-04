/**
 * Tests — VoucherCreateForm
 * UC-PRO-01: Crear voucher (Admin)
 *
 * These tests match the actual VoucherCreateForm component:
 *   - voucher_type field uses "PERCENTAGE" (not "PERCENT"), "FIXED", "FREE_SHIPPING"
 *   - Percentage validation: must be > 0 AND <= 100 (component validates > 0 && <= 100)
 *   - Payload sent: { code, voucher_type, max_uses, valid_from, valid_until,
 *                    discount_pct (for PERCENTAGE) or discount_value (for FIXED) }
 *   - valid_from is required (separate validation error)
 *   - API URL: /api/v2/admin/vouchers/
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import vouchersReducer from '@redux/slices/vouchersSlice';
import VoucherCreateForm from './VoucherCreateForm';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = () =>
  configureStore({ reducer: { vouchers: vouchersReducer } });

const wrap = (ui, store) => <Provider store={store}>{ui}</Provider>;

describe('VoucherCreateForm (UC-PRO-01)', () => {
  it('renderiza el dialogo con campos de codigo, tipo y valor', () => {
    render(wrap(<VoucherCreateForm onClose={() => {}} />, makeStore()));
    expect(screen.getByRole('dialog', { name: /Nuevo cupon/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Código/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tipo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Valor/i)).toBeInTheDocument();
  });

  it('valida codigo obligatorio', () => {
    render(wrap(<VoucherCreateForm onClose={() => {}} />, makeStore()));
    fireEvent.click(screen.getByRole('button', { name: /Crear cupon/i }));
    expect(screen.getByText(/El codigo es obligatorio/i)).toBeInTheDocument();
  });

  it('valida porcentaje entre 0 y 100', () => {
    render(wrap(<VoucherCreateForm onClose={() => {}} />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Código/i), {
      target: { value: 'TEST10' },
    });
    // Type field uses "PERCENTAGE" (not "PERCENT")
    fireEvent.change(screen.getByLabelText(/Tipo/i), {
      target: { value: 'PERCENTAGE' },
    });
    fireEvent.change(screen.getByLabelText(/Valor/i), {
      target: { value: '150' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Crear cupon/i }));
    expect(screen.getByText(/entre 0 y 100/i)).toBeInTheDocument();
  });

  it('valida que el valor fijo sea mayor a 0', () => {
    render(wrap(<VoucherCreateForm onClose={() => {}} />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Código/i), {
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
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v2/admin/vouchers/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json(
          { id: 99, code: 'WELCOME20', voucher_type: 'PERCENTAGE', discount_pct: 20, is_active: true },
          { status: 201 },
        );
      }),
    );

    render(wrap(<VoucherCreateForm onClose={() => {}} />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Código/i),
      { target: { value: 'WELCOME20' } });
    // Use PERCENTAGE (not PERCENT) — actual component field value
    fireEvent.change(screen.getByLabelText(/Tipo/i),
      { target: { value: 'PERCENTAGE' } });
    fireEvent.change(screen.getByLabelText(/Valor/i),
      { target: { value: '20' } });
    // valid_from is required by component validation
    fireEvent.change(screen.getByLabelText(/Vigente desde/i),
      { target: { value: '2026-01-01' } });

    fireEvent.click(screen.getByRole('button', { name: /Crear cupon/i }));

    await waitFor(() => {
      expect(lastBody).toMatchObject({
        code:         'WELCOME20',
        voucher_type: 'PERCENTAGE',
        discount_pct: 20,
      });
    });
  });

  it('llama a onClose al pulsar Cancelar', () => {
    const onClose = jest.fn();
    render(wrap(<VoucherCreateForm onClose={onClose} />, makeStore()));
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
