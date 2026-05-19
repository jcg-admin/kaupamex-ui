/**
 * Tests — VariantSelector
 * UC-CHT-01: Ver variantes disponibles de un producto.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import yorubaVariantsReducer from '@redux/slices/yorubaVariantsSlice';
import VariantSelector from './VariantSelector';

const makeStore = (preloadedYoruba = {}) =>
  configureStore({
    reducer: { yorubaVariants: yorubaVariantsReducer },
    preloadedState: {
      yorubaVariants: {
        selectedVariantId: null,
        adminVariants:     [],
        isLoading:         false,
        isActioning:       false,
        error:             null,
        actionError:       null,
        lastAction:        null,
        ...preloadedYoruba,
      },
    },
  });

const wrap = (ui, store = makeStore()) => (
  <Provider store={store}>{ui}</Provider>
);

const VARIANTS = [
  { id: 101, name: 'Chico',   price: 1200, stock: 5, is_active: true },
  { id: 102, name: 'Mediano', price: 1500, stock: 2, is_active: true },
  { id: 103, name: 'Grande',  price: 1800, stock: 0, is_active: true },
];

describe('VariantSelector (UC-CHT-01)', () => {
  it('no renderiza nada si no hay variantes', () => {
    const { container } = render(wrap(<VariantSelector variants={[]} />));
    expect(container.firstChild).toBeNull();
  });

  it('renderiza un boton/opcion por cada variante con su nombre', () => {
    render(wrap(<VariantSelector variants={VARIANTS} />));
    expect(screen.getByRole('button', { name: /Chico/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mediano/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Grande/ })).toBeInTheDocument();
  });

  it('muestra el precio de cada variante', () => {
    render(wrap(<VariantSelector variants={VARIANTS} />));
    expect(screen.getByText(/1,200/)).toBeInTheDocument();
    expect(screen.getByText(/1,500/)).toBeInTheDocument();
    expect(screen.getByText(/1,800/)).toBeInTheDocument();
  });

  it('deshabilita la variante sin stock con etiqueta visible', () => {
    render(wrap(<VariantSelector variants={VARIANTS} />));
    const grande = screen.getByRole('button', { name: /Grande/ });
    expect(grande).toBeDisabled();
    expect(grande).toHaveAttribute('aria-disabled', 'true');
    expect(grande).toHaveTextContent(/Sin stock/i);
  });

  it('al hacer click sobre una variante la marca como seleccionada', () => {
    const store = makeStore();
    render(wrap(<VariantSelector variants={VARIANTS} />, store));
    fireEvent.click(screen.getByRole('button', { name: /Mediano/ }));
    expect(store.getState().yorubaVariants.selectedVariantId).toBe(102);
  });

  it('marca visualmente la variante seleccionada con aria-pressed', () => {
    const store = makeStore({ selectedVariantId: 101 });
    render(wrap(<VariantSelector variants={VARIANTS} />, store));
    const chico = screen.getByRole('button', { name: /Chico/ });
    expect(chico).toHaveAttribute('aria-pressed', 'true');
  });

  it('si solo una variante tiene stock, queda preseleccionada automáticamente', () => {
    const oneAvailable = [
      { id: 1, name: 'Único', price: 999, stock: 3, is_active: true },
      { id: 2, name: 'Roto',  price: 999, stock: 0, is_active: true },
    ];
    const store = makeStore();
    render(wrap(<VariantSelector variants={oneAvailable} />, store));
    expect(store.getState().yorubaVariants.selectedVariantId).toBe(1);
  });

  it('expone un grupo accesible con aria-label', () => {
    render(wrap(<VariantSelector variants={VARIANTS} />));
    expect(screen.getByRole('group', { name: /variantes/i })).toBeInTheDocument();
  });

  it('si todas las variantes están sin stock, no preselecciona ninguna', () => {
    const allOut = [
      { id: 1, name: 'A', price: 100, stock: 0, is_active: true },
      { id: 2, name: 'B', price: 100, stock: 0, is_active: true },
    ];
    const store = makeStore();
    render(wrap(<VariantSelector variants={allOut} />, store));
    expect(store.getState().yorubaVariants.selectedVariantId).toBeNull();
  });
});
