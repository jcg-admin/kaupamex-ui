/**
 * Tests — AdminProductForm
 * H-06: los campos obligatorios se marcan (asterisco + aria-required) y, al
 * enviar vacío, cada campo inválido se señala con aria-invalid +
 * aria-describedby y el foco va al primero — no solo un mensaje genérico.
 */
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('@hooks/domain/useCategories', () => ({
  useAdminCategories: () => ({ data: { results: [{ id: 1, name: 'Collares' }] } }),
}));

import AdminProductForm from './AdminProductForm';

describe('AdminProductForm — required-field marking (H-06)', () => {
  it('marca los campos obligatorios con asterisco', () => {
    render(<AdminProductForm onSubmit={jest.fn()} />);
    // El nombre es obligatorio → su label lleva el asterisco.
    const nameLabel = screen.getByText('Nombre').closest('label');
    expect(nameLabel.textContent).toContain('*');
    // El SKU es opcional → sin asterisco.
    const skuLabel = screen.getByText(/SKU/).closest('label');
    expect(skuLabel.textContent).not.toContain('*');
  });

  it('aria-required en el control obligatorio', () => {
    render(<AdminProductForm onSubmit={jest.fn()} />);
    expect(screen.getByLabelText(/Nombre/)).toHaveAttribute('aria-required', 'true');
  });

  it('al enviar vacío marca cada campo inválido y no llama onSubmit', () => {
    const onSubmit = jest.fn();
    render(<AdminProductForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /Crear producto/ }));

    expect(onSubmit).not.toHaveBeenCalled();

    const nameInput = screen.getByLabelText(/Nombre/);
    expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    expect(nameInput).toHaveAttribute('aria-describedby', 'product-name-error');
    // El mensaje enlazado existe y dice qué falta.
    expect(screen.getByText(/El nombre es obligatorio/)).toBeInTheDocument();
    // El foco va al primer campo inválido.
    expect(nameInput).toHaveFocus();
  });

  it('limpia el error de un campo al escribir en él', () => {
    render(<AdminProductForm onSubmit={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Crear producto/ }));
    const nameInput = screen.getByLabelText(/Nombre/);
    expect(nameInput).toHaveAttribute('aria-invalid', 'true');

    fireEvent.change(nameInput, { target: { value: 'Collar de Oshun' } });
    expect(nameInput).not.toHaveAttribute('aria-invalid');
  });
});
