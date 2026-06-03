// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/Collapse/Collapse.test.jsx
/**
 * Tests: Collapse — API completa de ui-core collapse.js
 * Opciones: toggle, parent, horizontal
 * Métodos: toggle, show, hide, dispose, isShown
 * Eventos: onShow, onShown, onHide, onHidden
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { createRef } from 'react';
import Collapse from './Collapse';

describe('Collapse — API completa ui-core', () => {
  it('está cerrado por defecto', () => {
    render(<Collapse trigger="Ver más"><p>Contenido</p></Collapse>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  });

  it('defaultOpen=true lo muestra al montar', () => {
    render(<Collapse defaultOpen trigger="T"><p>Visible</p></Collapse>);
    expect(screen.getByText('Visible')).toBeInTheDocument();
  });

  it('click en trigger abre y cierra (toggle)', () => {
    render(<Collapse trigger="Toggle"><p>Cuerpo</p></Collapse>);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Cuerpo')).toBeInTheDocument();
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('llama onShow al abrir', () => {
    const onShow = jest.fn();
    render(<Collapse trigger="T" onShow={onShow}><p>C</p></Collapse>);
    fireEvent.click(screen.getByRole('button'));
    expect(onShow).toHaveBeenCalledTimes(1);
  });

  it('llama onHide al cerrar', () => {
    const onHide = jest.fn();
    render(<Collapse trigger="T" defaultOpen onHide={onHide}><p>C</p></Collapse>);
    fireEvent.click(screen.getByRole('button'));
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it('ref.show() / hide() / toggle()', () => {
    const ref = createRef();
    render(<Collapse ref={ref}><p>Content</p></Collapse>);
    act(() => ref.current.show());
    expect(ref.current.isShown()).toBe(true);
    act(() => ref.current.hide());
    expect(ref.current.isShown()).toBe(false);
    act(() => ref.current.toggle());
    expect(ref.current.isShown()).toBe(true);
  });

  it('ref expone toggle / show / hide / dispose / isShown', () => {
    const ref = createRef();
    render(<Collapse ref={ref}><p>C</p></Collapse>);
    ['toggle','show','hide','dispose','isShown'].forEach(m => {
      expect(typeof ref.current?.[m]).toBe('function');
    });
  });

  it('controlled via open prop', () => {
    const { rerender } = render(<Collapse open={false}><p>C</p></Collapse>);
    expect(screen.queryByText('C')).not.toBeInTheDocument();
    rerender(<Collapse open={true}><p>C</p></Collapse>);
    expect(screen.getByText('C')).toBeInTheDocument();
  });
});
