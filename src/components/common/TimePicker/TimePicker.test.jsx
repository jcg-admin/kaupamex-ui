// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/TimePicker/TimePicker.test.jsx
/**
 * Tests: TimePicker — lógica completa de ui-core time-picker.js
 * Iniciativa: implementar-componentes-diferidos-ui-core
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { createRef } from 'react';
import TimePicker from './TimePicker';

describe('TimePicker', () => {
  it('renderiza el input con placeholder', () => {
    render(<TimePicker placeholder="Seleccionar hora" />);
    expect(screen.getByPlaceholderText('Seleccionar hora')).toBeInTheDocument();
  });

  it('indicator=true muestra el icono de reloj (default ui-core)', () => {
    render(<TimePicker />);
    expect(screen.getByLabelText('Abrir selector de hora')).toBeInTheDocument();
  });

  it('al click en el indicador abre el panel', () => {
    render(<TimePicker />);
    fireEvent.click(screen.getByLabelText('Abrir selector de hora'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('segundo click en el indicador cierra el panel (toggle)', () => {
    render(<TimePicker />);
    const indicator = screen.getByLabelText('Abrir selector de hora');
    fireEvent.click(indicator);
    fireEvent.click(indicator);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('footer=true muestra botones Cancelar y OK (default ui-core)', () => {
    render(<TimePicker />);
    fireEvent.click(screen.getByLabelText('Abrir selector de hora'));
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument();
  });

  it('Cancelar cierra sin confirmar', () => {
    const onCancel = jest.fn();
    render(<TimePicker onCancel={onCancel} />);
    fireEvent.click(screen.getByLabelText('Abrir selector de hora'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('cleaner=true muestra botón de limpiar cuando hay valor', () => {
    render(<TimePicker value="10:30:00" cleaner />);
    expect(screen.getByLabelText('Limpiar hora')).toBeInTheDocument();
  });

  it('Escape cierra el panel', () => {
    render(<TimePicker />);
    fireEvent.click(screen.getByLabelText('Abrir selector de hora'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('ref expone toggle/show/hide/cancel/clear/reset/update', () => {
    const ref = createRef();
    render(<TimePicker ref={ref} />);
    ['toggle','show','hide','cancel','clear','reset','update'].forEach(m => {
      expect(typeof ref.current?.[m]).toBe('function');
    });
  });

  it('disabled impide la apertura', () => {
    render(<TimePicker disabled />);
    fireEvent.click(screen.getByLabelText('Abrir selector de hora'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
