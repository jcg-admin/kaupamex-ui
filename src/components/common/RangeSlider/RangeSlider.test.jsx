// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/RangeSlider/RangeSlider.test.jsx
/**
 * Tests: RangeSlider — API completa de ui-core range-slider.js
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { createRef } from 'react';
import RangeSlider from './RangeSlider';

describe('RangeSlider — API completa ui-core', () => {
  it('renderiza un input range', () => {
    render(<RangeSlider />);
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('min / max / step se aplican al input', () => {
    render(<RangeSlider min={10} max={200} step={5} />);
    const input = screen.getByRole('slider');
    expect(input).toHaveAttribute('min', '10');
    expect(input).toHaveAttribute('max', '200');
    expect(input).toHaveAttribute('step', '5');
  });

  it('tooltips=true muestra el tooltip con el valor', () => {
    render(<RangeSlider defaultValue={50} tooltips />);
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('tooltipsFormat formatea el valor del tooltip', () => {
    render(<RangeSlider defaultValue={75} tooltips tooltipsFormat={v => `${v}%`} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('onChange se llama al mover el slider', () => {
    const onChange = jest.fn();
    render(<RangeSlider onChange={onChange} />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '60' } });
    expect(onChange).toHaveBeenCalledWith(60);
  });

  it('labels renderiza etiquetas bajo el track', () => {
    render(<RangeSlider labels={['Bajo', 'Medio', 'Alto']} />);
    expect(screen.getByText('Bajo')).toBeInTheDocument();
    expect(screen.getByText('Alto')).toBeInTheDocument();
  });

  it('range [start, end] renderiza el slider de rango', () => {
    // Verificar que el componente acepta array y renderiza sin errores
    const { container } = render(<RangeSlider defaultValue={[20, 80]} tooltips />);
    // Los tooltips del rango
    const tooltipTexts = [...container.querySelectorAll('[class]')]
      .map(el => el.textContent)
      .filter(t => t === '20' || t === '80');
    expect(tooltipTexts.length).toBeGreaterThanOrEqual(2);
  });

  it('ref.update(config) actualiza el valor', () => {
    const ref = createRef();
    render(<RangeSlider ref={ref} defaultValue={30} tooltips />);
    act(() => ref.current.update({ value: 70 }));
    expect(screen.getByText('70')).toBeInTheDocument();
  });

  it('disabled bloquea la interacción', () => {
    render(<RangeSlider disabled />);
    expect(screen.getByRole('slider')).toBeDisabled();
  });
});
