/**
 * Tests — ProductDiscountEditForm
 * UC-DASH-02: Editar descuento de producto
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }       from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { patch: jest.fn() },
}));

import apiService from '@services/apiService';
import productDiscountsReducer from '@redux/slices/productDiscountsSlice';
import ProductDiscountEditForm from './ProductDiscountEditForm';

const DISCOUNT = {
  id: 1, product_id: 10, product_name: 'Camiseta Yoruba',
  discount_pct: 15.0, valid_from: '2026-01-01', valid_until: '2026-12-31',
  status: 'CURRENT', is_active: true,
  original_price: 100, discounted_price: 85,
};

const makeStore = () =>
  configureStore({ reducer: { productDiscounts: productDiscountsReducer } });

const wrap = (ui, store) => <Provider store={store}>{ui}</Provider>;

afterEach(() => jest.clearAllMocks());

describe('ProductDiscountEditForm (UC-DASH-02)', () => {
  it('precarga los valores actuales del descuento', () => {
    render(wrap(
      <ProductDiscountEditForm discount={DISCOUNT} onClose={() => {}} />,
      makeStore(),
    ));
    expect(screen.getByLabelText(/Porcentaje/i)).toHaveValue(15);
    expect(screen.getByLabelText(/Vigente desde/i)).toHaveValue('2026-01-01');
    expect(screen.getByLabelText(/Vigente hasta/i)).toHaveValue('2026-12-31');
  });

  it('muestra el nombre del producto como solo lectura', () => {
    render(wrap(
      <ProductDiscountEditForm discount={DISCOUNT} onClose={() => {}} />,
      makeStore(),
    ));
    const productField = screen.getByLabelText('Producto');
    expect(productField).toHaveValue('Camiseta Yoruba');
    expect(productField).toHaveAttribute('readonly');
  });

  it('valida el rango de fechas antes de enviar', async () => {
    render(wrap(
      <ProductDiscountEditForm discount={DISCOUNT} onClose={() => {}} />,
      makeStore(),
    ));

    fireEvent.change(screen.getByLabelText(/Vigente desde/i), {
      target: { value: '2027-01-01' },
    });
    fireEvent.change(screen.getByLabelText(/Vigente hasta/i), {
      target: { value: '2026-06-30' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    expect(
      await screen.findByText(/fecha de fin no puede ser anterior/i),
    ).toBeInTheDocument();
    expect(apiService.patch).not.toHaveBeenCalled();
  });

  it('envia PATCH con los campos modificados', async () => {
    apiService.patch.mockResolvedValue({
      data: { ...DISCOUNT, discount_pct: 20.0 },
    });

    const onClose = jest.fn();
    render(wrap(
      <ProductDiscountEditForm discount={DISCOUNT} onClose={onClose} />,
      makeStore(),
    ));

    fireEvent.change(screen.getByLabelText(/Porcentaje/i), {
      target: { value: '20' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    await waitFor(() => {
      expect(apiService.patch).toHaveBeenCalledWith(
        '/api/v1/admin/product-discounts/1/',
        {
          discount_pct: 20,
          valid_from:   '2026-01-01',
          valid_until:  '2026-12-31',
        },
      );
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('permite limpiar valid_until enviando null', async () => {
    apiService.patch.mockResolvedValue({ data: DISCOUNT });

    render(wrap(
      <ProductDiscountEditForm discount={DISCOUNT} onClose={() => {}} />,
      makeStore(),
    ));

    fireEvent.change(screen.getByLabelText(/Vigente hasta/i), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    await waitFor(() => {
      expect(apiService.patch).toHaveBeenCalledWith(
        '/api/v1/admin/product-discounts/1/',
        expect.objectContaining({ valid_until: null }),
      );
    });
  });
});
