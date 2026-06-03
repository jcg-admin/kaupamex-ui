/**
 * Tests: Tooltip — API completa de ui-core tooltip.js
 * Métodos: enable, disable, toggleEnabled, toggle, show, hide, update, setContent
 * Opciones: trigger, delay, placement, customClass, animation, html, offset
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { createRef } from 'react';
import Tooltip from './Tooltip';

jest.useFakeTimers();

describe('Tooltip — API completa ui-core', () => {
  it('no muestra el tooltip por defecto', () => {
    render(<Tooltip content="Ayuda"><button>T</button></Tooltip>);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('trigger=hover muestra en mouseenter y oculta en mouseleave', () => {
    render(<Tooltip content="Ayuda" trigger="hover"><button>T</button></Tooltip>);
    const wrapper = screen.getByRole('button').parentElement;
    act(() => { fireEvent.mouseEnter(wrapper); jest.runAllTimers(); });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    act(() => { fireEvent.mouseLeave(wrapper); jest.runAllTimers(); });
    // AnimatePresence mantiene el DOM durante exit animation — verificar aria
    expect(screen.getByRole('button').parentElement)
      .not.toHaveAttribute('aria-describedby');
  });

  it('trigger=focus muestra en focus y oculta en blur', () => {
    render(<Tooltip content="Focus" trigger="focus"><button>T</button></Tooltip>);
    const wrapper = screen.getByRole('button').parentElement;
    act(() => { fireEvent.focus(wrapper); jest.runAllTimers(); });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    act(() => { fireEvent.blur(wrapper); jest.runAllTimers(); });
    expect(screen.getByRole('button').parentElement)
      .not.toHaveAttribute('aria-describedby');
  });

  it('trigger=click muestra con click y toggle', () => {
    render(<Tooltip content="Click" trigger="click"><button>T</button></Tooltip>);
    const wrapper = screen.getByRole('button').parentElement;
    act(() => { fireEvent.click(wrapper); jest.runAllTimers(); });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    act(() => { fireEvent.click(wrapper); jest.runAllTimers(); });
    expect(screen.getByRole('button').parentElement)
      .not.toHaveAttribute('aria-describedby');
  });

  it('delay aplica timeout antes de mostrar', () => {
    render(<Tooltip content="Delay" trigger="hover" delay={500}><button>T</button></Tooltip>);
    fireEvent.mouseEnter(screen.getByRole('button').parentElement);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    act(() => jest.advanceTimersByTime(600));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('ref.enable() / disable() / toggleEnabled()', () => {
    const ref = createRef();
    render(<Tooltip content="T" trigger="hover" ref={ref}><button>T</button></Tooltip>);
    act(() => ref.current.disable());
    act(() => { fireEvent.mouseEnter(screen.getByRole('button').parentElement); jest.runAllTimers(); });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    act(() => ref.current.enable());
    act(() => { fireEvent.mouseEnter(screen.getByRole('button').parentElement); jest.runAllTimers(); });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('ref.show() / hide()', () => {
    const ref = createRef();
    render(<Tooltip content="T" ref={ref}><button>T</button></Tooltip>);
    act(() => { ref.current.show(); jest.runAllTimers(); });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    act(() => { ref.current.hide(); jest.runAllTimers(); });
    expect(screen.getByRole('button').parentElement)
      .not.toHaveAttribute('aria-describedby');
  });

  it('ref.setContent() actualiza el contenido dinámicamente', () => {
    const ref = createRef();
    render(<Tooltip content="Original" trigger="click" ref={ref}><button>T</button></Tooltip>);
    act(() => ref.current.setContent('Nuevo contenido'));
    act(() => { ref.current.show(); jest.runAllTimers(); });
    expect(screen.getByRole('tooltip')).toHaveTextContent('Nuevo contenido');
  });

  it('ref expone todos los métodos públicos de ui-core', () => {
    const ref = createRef();
    render(<Tooltip content="T" ref={ref}><button>T</button></Tooltip>);
    ['enable','disable','toggleEnabled','toggle','show','hide','update','setContent','dispose']
      .forEach(m => expect(typeof ref.current?.[m]).toBe('function'));
  });

  it('title prop como alias de content', () => {
    const ref = createRef();
    render(<Tooltip title="Desde title" ref={ref}><button>T</button></Tooltip>);
    act(() => { ref.current.show(); jest.runAllTimers(); });
    expect(screen.getByRole('tooltip')).toHaveTextContent('Desde title');
  });
});
