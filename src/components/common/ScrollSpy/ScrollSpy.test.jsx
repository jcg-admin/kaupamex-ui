// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/ScrollSpy/ScrollSpy.test.jsx
/**
 * Tests: ScrollSpy + useScrollSpy — ui-core scrollspy.js
 * Iniciativa: implementar-componentes-diferidos-ui-core
 */
import { render, screen, act } from '@testing-library/react';
import { createRef } from 'react';
import ScrollSpy, { useScrollSpy } from './ScrollSpy';
import { renderHook } from '@testing-library/react';

// IntersectionObserver mock para jsdom
let observerCallback;
global.IntersectionObserver = jest.fn().mockImplementation((cb, opts) => {
  observerCallback = cb;
  return {
    observe:    jest.fn(),
    unobserve:  jest.fn(),
    disconnect: jest.fn(),
  };
});

describe('useScrollSpy', () => {
  it('retorna activeId inicial con el primer id', () => {
    const { result } = renderHook(() =>
      useScrollSpy({ ids: ['intro', 'features', 'pricing'] })
    );
    expect(result.current.activeId).toBe('intro');
  });

  it('retorna función refresh()', () => {
    const { result } = renderHook(() => useScrollSpy({ ids: ['a', 'b'] }));
    expect(typeof result.current.refresh).toBe('function');
  });

  it('actualiza activeId cuando IntersectionObserver dispara una entrada', () => {
    // Crear elemento real para que getElementById funcione
    const el = document.createElement('section');
    el.id = 'features';
    document.body.appendChild(el);

    const { result } = renderHook(() =>
      useScrollSpy({ ids: ['intro', 'features'] })
    );

    act(() => {
      observerCallback([{ isIntersecting: true, intersectionRatio: 0.8, target: el }]);
    });

    expect(result.current.activeId).toBe('features');
    document.body.removeChild(el);
  });

  it('ignora entradas no visibles (isIntersecting=false)', () => {
    const { result } = renderHook(() => useScrollSpy({ ids: ['intro', 'features'] }));

    act(() => {
      observerCallback([{
        isIntersecting: false, intersectionRatio: 0, target: { id: 'features' }
      }]);
    });

    // El activeId no debería cambiar
    expect(result.current.activeId).toBe('intro');
  });
});

describe('ScrollSpy componente', () => {
  it('renderiza children', () => {
    render(
      <ScrollSpy ids={['intro']}>
        <section id="intro"><h2>Introducción</h2></section>
      </ScrollSpy>
    );
    expect(screen.getByText('Introducción')).toBeInTheDocument();
  });

  it('expone refresh() via ref', () => {
    const ref = createRef();
    render(<ScrollSpy ids={['intro']} ref={ref}><div /></ScrollSpy>);
    expect(typeof ref.current?.refresh).toBe('function');
  });

  it('activa aria-current=location en el link correspondiente', () => {
    const navRef = createRef();
    const el = document.createElement('section');
    el.id = 'intro';
    document.body.appendChild(el);

    render(
      <>
        <nav ref={navRef}>
          <a href="#intro">Intro</a>
          <a href="#features">Features</a>
        </nav>
        <ScrollSpy ids={['intro', 'features']} navRef={navRef}>
          <div />
        </ScrollSpy>
      </>
    );

    act(() => {
      observerCallback([{ isIntersecting: true, intersectionRatio: 1, target: el }]);
    });

    const link = screen.getByRole('link', { name: 'Intro' });
    expect(link).toHaveAttribute('aria-current', 'location');
    document.body.removeChild(el);
  });
});
