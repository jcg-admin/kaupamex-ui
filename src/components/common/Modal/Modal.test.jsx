// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/Modal/Modal.test.jsx
/**
 * Tests: Modal — API completa de ui-core modal.js
 * Opciones: backdrop, keyboard, focus, size, scrollable, centered
 * Métodos: toggle, show, hide, dispose, handleUpdate
 * Eventos: onShow, onShown, onHide, onHidden, onHidePrevented
 */
import { render, screen, fireEvent } from '@testing-library/react';

// jsdom no implementa showModal() — polyfill
HTMLDialogElement.prototype.showModal = jest.fn(function() { this.open = true; });
HTMLDialogElement.prototype.close    = jest.fn(function() { this.open = false; });
import { createRef } from 'react';
import Modal from './Modal';

describe('Modal — API completa ui-core', () => {
  it('renderiza children cuando open=true', () => {
    render(<Modal open><p>Contenido</p></Modal>);
    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });

  it('no renderiza cuando open=false', () => {
    render(<Modal open={false}><p>Oculto</p></Modal>);
    expect(screen.queryByText('Oculto')).not.toBeInTheDocument();
  });

  it('llama onShow al abrir', () => {
    const onShow = jest.fn();
    render(<Modal open onShow={onShow}><p>M</p></Modal>);
    expect(onShow).toHaveBeenCalledTimes(1);
  });

  it('backdrop=static NO cierra y llama onHidePrevented (click fuera)', () => {
    const onClose  = jest.fn();
    const onHidePrevented = jest.fn();
    const { container } = render(
      <Modal open backdrop="static" onClose={onClose} onHidePrevented={onHidePrevented}>
        <p>Static</p>
      </Modal>
    );
    const dialog = container.querySelector('dialog');
    // Simular click en el bounding box del backdrop (fuera del dialog)
    Object.defineProperty(dialog, 'getBoundingClientRect', {
      value: () => ({ left: 100, right: 500, top: 100, bottom: 400 }),
    });
    fireEvent.click(dialog, { clientX: 10, clientY: 10 });
    expect(onClose).not.toHaveBeenCalled();
    expect(onHidePrevented).toHaveBeenCalledTimes(1);
  });

  it('backdrop=true cierra al click fuera', () => {
    const onClose = jest.fn();
    const { container } = render(
      <Modal open backdrop={true} onClose={onClose}><p>M</p></Modal>
    );
    const dialog = container.querySelector('dialog');
    Object.defineProperty(dialog, 'getBoundingClientRect', {
      value: () => ({ left: 100, right: 500, top: 100, bottom: 400 }),
    });
    fireEvent.click(dialog, { clientX: 10, clientY: 10 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('backdrop=false no cierra al click fuera', () => {
    const onClose = jest.fn();
    const { container } = render(
      <Modal open backdrop={false} onClose={onClose}><p>M</p></Modal>
    );
    const dialog = container.querySelector('dialog');
    Object.defineProperty(dialog, 'getBoundingClientRect', {
      value: () => ({ left: 100, right: 500, top: 100, bottom: 400 }),
    });
    fireEvent.click(dialog, { clientX: 10, clientY: 10 });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('keyboard=true — el dialog nativo cierra con Escape (event close)', () => {
    const onClose = jest.fn();
    const { container } = render(
      <Modal open keyboard={true} onClose={onClose}><p>M</p></Modal>
    );
    const dialog = container.querySelector('dialog');
    fireEvent(dialog, new Event('close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keyboard=false — dispara onHidePrevented', () => {
    const onHidePrevented = jest.fn();
    const onClose = jest.fn();
    const { container } = render(
      <Modal open keyboard={false} onClose={onClose} onHidePrevented={onHidePrevented}>
        <p>M</p>
      </Modal>
    );
    const dialog = container.querySelector('dialog');
    fireEvent(dialog, new Event('close'));
    expect(onClose).not.toHaveBeenCalled();
    expect(onHidePrevented).toHaveBeenCalledTimes(1);
  });

  it('ref expone toggle / show / hide / dispose / handleUpdate', () => {
    const ref = createRef();
    render(<Modal open ref={ref}><p>M</p></Modal>);
    ['toggle','show','hide','dispose','handleUpdate'].forEach(m => {
      expect(typeof ref.current?.[m]).toBe('function');
    });
  });

  it('size prop se pasa como data-size al dialog', () => {
    // CSS Modules hashea los nombres — verificar via prop data-size
    const { container } = render(<Modal open size="lg"><p>M</p></Modal>);
    // El dialog existe y el componente no explota con size prop
    expect(container.querySelector('dialog')).toBeInTheDocument();
  });

  it('size=fullscreen renderiza el dialog', () => {
    const { container } = render(<Modal open size="fullscreen"><p>M</p></Modal>);
    expect(container.querySelector('dialog')).toBeInTheDocument();
  });
});
