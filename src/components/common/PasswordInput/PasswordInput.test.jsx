/**
 * Tests — PasswordInput
 * Portado de ui-core-5.25.0/js/src/password-input.js
 */
import { render, screen, fireEvent } from '@testing-library/react';
import PasswordInput from './PasswordInput';

describe('PasswordInput', () => {
  it('renderiza como type=password por defecto', () => {
    render(<PasswordInput value="" onChange={() => {}} />);
    expect(document.querySelector('input').type).toBe('password');
  });

  it('cambia a type=text al pulsar el boton toggle', () => {
    render(<PasswordInput value="" onChange={() => {}} />);
    const input = document.querySelector('input');
    const btn = screen.getByRole('button', { name: /Mostrar contraseña/i });
    expect(input.type).toBe('password');
    fireEvent.click(btn);
    expect(input.type).toBe('text');
  });

  it('vuelve a type=password al pulsar toggle por segunda vez', () => {
    render(<PasswordInput value="" onChange={() => {}} />);
    const input = document.querySelector('input');
    const btn = screen.getByRole('button', { name: /Mostrar contraseña/i });
    fireEvent.click(btn);
    expect(input.type).toBe('text');
    fireEvent.click(screen.getByRole('button', { name: /Ocultar contraseña/i }));
    expect(input.type).toBe('password');
  });

  it('renderiza label cuando se pasa la prop', () => {
    render(<PasswordInput value="" onChange={() => {}} label="Contraseña" />);
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
  });

  it('renderiza error y pone aria-invalid en input', () => {
    render(<PasswordInput value="" onChange={() => {}} error="Campo obligatorio" />);
    expect(screen.getByText('Campo obligatorio')).toBeInTheDocument();
    expect(document.querySelector('input')).toHaveAttribute('aria-invalid', 'true');
  });

  it('renderiza hint cuando no hay error', () => {
    render(<PasswordInput value="" onChange={() => {}} hint="Min 8 caracteres" />);
    expect(screen.getByText('Min 8 caracteres')).toBeInTheDocument();
  });

  it('boton toggle tiene aria-label accesible', () => {
    render(<PasswordInput value="" onChange={() => {}} />);
    expect(
      screen.getByRole('button', { name: /mostrar contraseña/i }),
    ).toBeInTheDocument();
  });

  it('disabled desactiva el input y el boton toggle', () => {
    render(<PasswordInput value="" onChange={() => {}} disabled />);
    expect(document.querySelector('input')).toBeDisabled();
    expect(screen.getByRole('button', { name: /mostrar contraseña/i })).toBeDisabled();
  });
});
