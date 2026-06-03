// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/Stepper/Stepper.test.jsx
/**
 * Tests: Stepper — API completa de ui-core stepper.js
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { createRef } from 'react';
import Stepper, { StepPanel } from './Stepper';

const Steps = ({ stepRef, ...p }) => (
  <Stepper ref={stepRef} {...p}>
    <StepPanel label="Información">Panel 1</StepPanel>
    <StepPanel label="Detalles">Panel 2</StepPanel>
    <StepPanel label="Confirmación">Panel 3</StepPanel>
  </Stepper>
);

describe('Stepper — API completa ui-core', () => {
  it('muestra el primer paso por defecto', () => {
    render(<Steps />);
    expect(screen.getByText('Panel 1')).toBeInTheDocument();
  });

  it('los tabs muestran los labels de cada paso', () => {
    render(<Steps />);
    expect(screen.getByRole('tab', { name: /Información/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Confirmación/i })).toBeInTheDocument();
  });

  it('el paso activo tiene aria-current=step', () => {
    render(<Steps />);
    expect(screen.getByRole('tab', { name: /Información/i }))
      .toHaveAttribute('aria-current', 'step');
  });

  it('ref.next() avanza al siguiente paso', () => {
    const ref = createRef();
    render(<Steps stepRef={ref} />);
    act(() => ref.current.next());
    expect(screen.getByText('Panel 2')).toBeInTheDocument();
  });

  it('ref.prev() retrocede al paso anterior', () => {
    const ref = createRef();
    render(<Steps stepRef={ref} defaultStep={1} />);
    act(() => ref.current.prev());
    expect(screen.getByText('Panel 1')).toBeInTheDocument();
  });

  it('ref.showStep(n) va al paso n', () => {
    const ref = createRef();
    render(<Steps stepRef={ref} />);
    act(() => ref.current.showStep(2));
    expect(screen.getByText('Panel 3')).toBeInTheDocument();
  });

  it('linear=true impide al usuario saltar pasos no visitados (click)', () => {
    render(<Steps linear />);
    // El tab del paso 2 (idx=2) tiene aria-disabled cuando linear=true y active=0
    const tabC = screen.getByRole('tab', { name: /Confirmación/i });
    expect(tabC).toHaveAttribute('aria-disabled', 'true');
  });

  it('ref.reset() vuelve al primer paso', () => {
    const ref = createRef();
    render(<Steps stepRef={ref} defaultStep={2} />);
    act(() => ref.current.reset());
    expect(screen.getByText('Panel 1')).toBeInTheDocument();
  });

  it('onStepChange se llama al cambiar de paso', () => {
    const onChange = jest.fn();
    const ref = createRef();
    render(<Steps stepRef={ref} onStepChange={onChange} />);
    act(() => ref.current.next());
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('onFinish se llama al pasar del último paso', () => {
    const onFinish = jest.fn();
    const ref = createRef();
    render(<Steps stepRef={ref} defaultStep={2} onFinish={onFinish} />);
    act(() => ref.current.next());
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('ref expone showStep/next/prev/finish/reset', () => {
    const ref = createRef();
    render(<Steps stepRef={ref} />);
    ['showStep','next','prev','finish','reset','getActiveStep'].forEach(m => {
      expect(typeof ref.current?.[m]).toBe('function');
    });
  });
});
