/**
 * Tests — AdminReturnReceptionPanel
 * UC-RET-03: Registrar recepción del producto devuelto.
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
import AdminReturnReceptionPanel from './AdminReturnReceptionPanel';

const makeStore = () =>
  configureStore({ reducer: { returns: returnsReducer } });

const wrap = (ui, store) => (
  <Provider store={store}>{ui}</Provider>
);

const APPROVED = {
  id: 300,
  status: 'APROBADA',
  received_at: null,
};

const COMPLETED = { id: 300, status: 'COMPLETADA', received_at: '2026-05-11T10:00:00Z' };

afterEach(() => jest.clearAllMocks());

describe('AdminReturnReceptionPanel (UC-RET-03)', () => {
  it('no se renderiza si la devolucion no esta en estado APROBADA', () => {
    const { container } = render(
      wrap(<AdminReturnReceptionPanel returnRequest={COMPLETED} />, makeStore())
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra los controles para registrar la recepción', () => {
    render(wrap(<AdminReturnReceptionPanel returnRequest={APPROVED} />, makeStore()));
    expect(screen.getByRole('heading', { name: /Recepci.n f.sica/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Estado del producto/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Registrar recepci/i })).toBeInTheDocument();
  });

  it('registra la recepción con el estado del producto y observaciones', async () => {
    apiService.post.mockResolvedValue({
      data: { ...APPROVED, status: 'COMPLETADA' },
    });

    render(wrap(<AdminReturnReceptionPanel returnRequest={APPROVED} />, makeStore()));

    fireEvent.change(screen.getByLabelText(/Estado del producto/i),
      { target: { value: 'DANADO' } });
    fireEvent.change(screen.getByLabelText(/Observaciones/i),
      { target: { value: 'Caja golpeada y producto rayado.' } });
    fireEvent.click(screen.getByRole('button', { name: /Registrar recepci/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        expect.stringContaining('/admin/returns/300/reception/'),
        expect.objectContaining({
          product_condition: 'DANADO',
          observations:      'Caja golpeada y producto rayado.',
        }),
      );
    });
  });
});
