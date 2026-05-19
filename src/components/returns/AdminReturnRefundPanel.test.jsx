/**
 * Tests — AdminReturnRefundPanel
 * UC-RET-06: Procesar reembolso de devolución (Admin)
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }      from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import returnsReducer from '@redux/slices/returnsSlice';
import AdminReturnRefundPanel from './AdminReturnRefundPanel';

const makeStore = () =>
  configureStore({ reducer: { returns: returnsReducer } });

const wrap = (ui, store) => (
  <Provider store={store}>{ui}</Provider>
);

const COMPLETED = {
  id: 300,
  status: 'COMPLETADA',
  payment: {
    id: 9001,
    amount: 1250,
    gateway: 'MERCADOPAGO',
    status: 'APPROVED',
  },
  refund_amount_suggested: 1250,
};

const NOT_ELIGIBLE = { id: 300, status: 'APROBADA' };

afterEach(() => jest.clearAllMocks());

describe('AdminReturnRefundPanel (UC-RET-06)', () => {
  it('no se renderiza si la devolución no está en estado COMPLETADA', () => {
    const { container } = render(
      wrap(<AdminReturnRefundPanel returnRequest={NOT_ELIGIBLE} />, makeStore())
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra el resumen del pago original y el monto sugerido', () => {
    render(wrap(<AdminReturnRefundPanel returnRequest={COMPLETED} />, makeStore()));
    expect(screen.getByRole('heading', { name: /Procesar reembolso/i })).toBeInTheDocument();
    expect(screen.getByText(/MERCADOPAGO/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Monto a reembolsar/i)).toHaveValue(1250);
  });

  it('procesa el reembolso con el monto confirmado', async () => {
    apiService.post.mockResolvedValue({
      data: { ...COMPLETED, refund: { status: 'APPROVED', amount: 1250 } },
    });

    render(wrap(<AdminReturnRefundPanel returnRequest={COMPLETED} />, makeStore()));
    fireEvent.click(screen.getByRole('button', { name: /Confirmar reembolso/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        expect.stringContaining('/admin/returns/300/refund/'),
        expect.objectContaining({ amount: 1250 }),
      );
    });
  });

  it('permite ajustar el monto antes de confirmar el reembolso', async () => {
    apiService.post.mockResolvedValue({
      data: { ...COMPLETED, refund: { status: 'APPROVED', amount: 900 } },
    });

    render(wrap(<AdminReturnRefundPanel returnRequest={COMPLETED} />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Monto a reembolsar/i),
      { target: { value: '900' } });
    fireEvent.click(screen.getByRole('button', { name: /Confirmar reembolso/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenLastCalledWith(
        expect.stringContaining('/admin/returns/300/refund/'),
        expect.objectContaining({ amount: 900 }),
      );
    });
  });

  it('valida que el monto sea positivo', () => {
    render(wrap(<AdminReturnRefundPanel returnRequest={COMPLETED} />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Monto a reembolsar/i),
      { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: /Confirmar reembolso/i }));

    expect(screen.getByText(/El monto debe ser mayor a cero/i)).toBeInTheDocument();
    expect(apiService.post).not.toHaveBeenCalled();
  });
});
