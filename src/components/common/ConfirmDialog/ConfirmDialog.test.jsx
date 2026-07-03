/**
 * Tests — ConfirmDialog (H-04)
 * Diálogo de confirmación de marca que reemplaza window.confirm.
 */
import { render, screen, fireEvent } from '@testing-library/react';

// jsdom no implementa <dialog>.showModal() — polyfill (igual que Modal.test).
HTMLDialogElement.prototype.showModal = jest.fn(function () { this.open = true; });
HTMLDialogElement.prototype.close     = jest.fn(function () { this.open = false; });

import ConfirmDialog from './ConfirmDialog';

describe('ConfirmDialog (H-04)', () => {
  it('no renderiza contenido cuando open=false', () => {
    render(<ConfirmDialog open={false} title="Eliminar" message="cuerpo" />);
    expect(screen.queryByText('Eliminar')).not.toBeInTheDocument();
  });

  it('muestra título y mensaje cuando open=true', () => {
    render(<ConfirmDialog open title="Eliminar producto" message="Adiós OJA" />);
    expect(screen.getByText('Eliminar producto')).toBeInTheDocument();
    expect(screen.getByText('Adiós OJA')).toBeInTheDocument();
  });

  it('dispara onConfirm al confirmar y onCancel al cancelar', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    render(
      <ConfirmDialog open title="Eliminar" message="x"
        confirmLabel="Eliminar" cancelLabel="Cancelar"
        onConfirm={onConfirm} onCancel={onCancel} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('deshabilita las acciones mientras isBusy', () => {
    render(<ConfirmDialog open title="Eliminar" message="x" isBusy />);
    expect(screen.getByRole('button', { name: /Procesando/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  });
});
