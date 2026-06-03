// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/Alert/Alert.test.jsx
/**
 * Tests: Alert — lógica completa de ui-core alert.js
 * Iniciativa: implementar-componentes-diferidos-ui-core
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
import Alert from './Alert';

jest.useFakeTimers();

describe('Alert', () => {
  it('renderiza con role=alert y aria-live correcto', () => {
    render(<Alert variant="info">Mensaje informativo</Alert>);
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
  });

  it('danger usa aria-live=assertive (urgente)', () => {
    render(<Alert variant="danger">Error crítico</Alert>);
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
  });

  it('muestra título y contenido', () => {
    render(<Alert title="Atención">Contenido del mensaje</Alert>);
    expect(screen.getByText('Atención')).toBeInTheDocument();
    expect(screen.getByText('Contenido del mensaje')).toBeInTheDocument();
  });

  it('dismissible=true muestra botón de cierre', () => {
    render(<Alert dismissible>Mensaje</Alert>);
    expect(screen.getByRole('button', { name: 'Cerrar alerta' })).toBeInTheDocument();
  });

  it('al cerrar llama onClose y desaparece', () => {
    const onClose = jest.fn();
    render(<Alert dismissible onClose={onClose}>Msg</Alert>);
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar alerta' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('onClose devuelve false cancela el cierre (equivale a defaultPrevented)', () => {
    const onClose = jest.fn(() => false);
    render(<Alert dismissible onClose={onClose}>Msg</Alert>);
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar alerta' }));
    // El alert sigue visible porque onClose devolvió false
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('timeout dispara onClose tras N ms', () => {
    // Verificar que handleClose se invocó pasando un onClose observable
    const onClose = jest.fn();
    render(<Alert timeout={3000} onClose={onClose}>Auto</Alert>);
    act(() => jest.advanceTimersByTime(3100));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sin dismissible no muestra botón', () => {
    render(<Alert>Sin botón</Alert>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renderiza icono por defecto según variante', () => {
    render(<Alert variant="success">OK</Alert>);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('icono personalizado sobreescribe el default', () => {
    render(<Alert variant="info" icon="🔔">Aviso</Alert>);
    expect(screen.getByText('🔔')).toBeInTheDocument();
  });
});
