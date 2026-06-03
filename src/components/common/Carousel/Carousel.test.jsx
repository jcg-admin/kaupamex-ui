// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/Carousel/Carousel.test.jsx
/**
 * Tests: Carousel — API completa de ui-core carousel.js
 * Opciones: interval, keyboard, pause, ride, touch, wrap
 * Métodos: next, prev, to, pause, cycle, dispose, nextWhenVisible
 * Eventos: onSlide, onSlid
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { createRef } from 'react';
import Carousel, { CarouselSlide } from './Carousel';

jest.useFakeTimers();

const Slides = (props) => (
  <Carousel {...props}>
    <CarouselSlide>Slide 1</CarouselSlide>
    <CarouselSlide>Slide 2</CarouselSlide>
    <CarouselSlide>Slide 3</CarouselSlide>
  </Carousel>
);

describe('Carousel — API completa ui-core', () => {
  it('muestra el primer slide por defecto', () => {
    render(<Slides />);
    expect(screen.getByText('Slide 1')).toBeInTheDocument();
  });

  it('ref.next() avanza al siguiente slide', () => {
    const ref = createRef();
    render(<Slides ref={ref} />);
    act(() => ref.current.next());
    // Verificar que el indicador 2 está activo (AnimatePresence puede mantener ambos slides)
    const dots = screen.getAllByRole('tab');
    expect(dots[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('ref.prev() vuelve al slide anterior (wrap=true)', () => {
    const ref = createRef();
    render(<Slides ref={ref} wrap />);
    act(() => ref.current.prev());
    const dots = screen.getAllByRole('tab');
    expect(dots[2]).toHaveAttribute('aria-selected', 'true');
  });

  it('ref.to(index) va directamente a un slide', () => {
    const ref = createRef();
    render(<Slides ref={ref} />);
    act(() => ref.current.to(2));
    const dots = screen.getAllByRole('tab');
    expect(dots[2]).toHaveAttribute('aria-selected', 'true');
  });

  it('wrap=false no pasa del último slide', () => {
    const ref = createRef();
    render(<Slides ref={ref} wrap={false} />);
    act(() => ref.current.to(2));
    act(() => ref.current.next()); // en el último, no debe avanzar
    const dots = screen.getAllByRole('tab');
    expect(dots[2]).toHaveAttribute('aria-selected', 'true');
  });

  it('keyboard=true: ArrowRight avanza al siguiente', () => {
    render(<Slides keyboard />);
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    const dots = screen.getAllByRole('tab');
    expect(dots[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('keyboard=true: ArrowLeft retrocede', () => {
    const ref = createRef();
    render(<Slides keyboard ref={ref} />);
    act(() => ref.current.to(1));
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    const dots = screen.getAllByRole('tab');
    expect(dots[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('ride=carousel auto-avanza tras el interval', () => {
    render(<Slides ride="carousel" interval={1000} />);
    expect(screen.getByText('Slide 1')).toBeInTheDocument();
    act(() => jest.advanceTimersByTime(1100));
    const dots = screen.getAllByRole('tab');
    expect(dots[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('showDots=true muestra indicadores', () => {
    render(<Slides showDots />);
    expect(screen.getAllByRole('tab').length).toBe(3);
  });

  it('showArrows=true muestra controles de navegación', () => {
    render(<Slides showArrows />);
    expect(screen.getByLabelText('Anterior')).toBeInTheDocument();
    expect(screen.getByLabelText('Siguiente')).toBeInTheDocument();
  });

  it('onSlide se llama antes de cambiar de slide', () => {
    const onSlide = jest.fn();
    const ref = createRef();
    render(<Slides ref={ref} onSlide={onSlide} />);
    act(() => ref.current.next());
    expect(onSlide).toHaveBeenCalledWith(0, 1, 'next');
  });

  it('ref expone next/prev/to/pause/cycle/dispose/nextWhenVisible', () => {
    const ref = createRef();
    render(<Slides ref={ref} />);
    ['next','prev','to','pause','cycle','dispose','nextWhenVisible'].forEach(m => {
      expect(typeof ref.current?.[m]).toBe('function');
    });
  });
});
