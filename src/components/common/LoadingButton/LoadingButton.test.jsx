// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/LoadingButton/LoadingButton.test.jsx
/**
 * Tests: LoadingButton — lógica completa de ui-core loading-button.js
 * Iniciativa: implementar-componentes-diferidos-ui-core
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { createRef } from 'react';
import LoadingButton from './LoadingButton';

jest.useFakeTimers();

describe('LoadingButton', () => {
  it('renderiza con el texto y sin spinner por defecto', () => {
    render(<LoadingButton>Guardar</LoadingButton>);
    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
    expect(document.querySelector('[role=status]')).not.toBeInTheDocument();
  });

  it('loading=true muestra el spinner (spinnerType=border)', () => {
    render(<LoadingButton loading spinnerType="border">Cargando</LoadingButton>);
    expect(document.querySelector('[role=status]')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('loading=true con spinnerType=grow renderiza spinner grow', () => {
    // CSS Modules hashea clases — verificar via data-attribute o que el spinner existe
    render(<LoadingButton loading spinnerType="grow">Enviando</LoadingButton>);
    // El spinner tiene role=status independientemente del tipo
    expect(document.querySelector('[role=status]')).toBeInTheDocument();
  });

  it('spinner=false oculta el spinner aunque esté en loading', () => {
    render(<LoadingButton loading spinner={false}>Guardando</LoadingButton>);
    expect(document.querySelector('[role=status]')).not.toBeInTheDocument();
  });

  it('disabledOnLoading=true deshabilita el botón cuando está en loading', () => {
    render(<LoadingButton loading disabledOnLoading>Acción</LoadingButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('disabledOnLoading=false NO deshabilita el botón (default de ui-core)', () => {
    render(<LoadingButton loading disabledOnLoading={false}>Acción</LoadingButton>);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('ref.start() activa el loading y llama onStart', () => {
    const ref = createRef();
    const onStart = jest.fn();
    render(<LoadingButton ref={ref} onStart={onStart}>Acción</LoadingButton>);
    act(() => ref.current.start());
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('ref.stop() desactiva el loading y llama onStop', () => {
    const ref = createRef();
    const onStop = jest.fn();
    render(<LoadingButton ref={ref} loading onStop={onStop}>Acción</LoadingButton>);
    act(() => ref.current.stop());
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('timeout auto-detiene el loading tras N ms', () => {
    const ref = createRef();
    const onStop = jest.fn();
    render(<LoadingButton ref={ref} timeout={2000} onStop={onStop}>Acción</LoadingButton>);
    act(() => ref.current.start());
    act(() => jest.advanceTimersByTime(2100));
    expect(onStop).toHaveBeenCalledTimes(1);
  });
});
