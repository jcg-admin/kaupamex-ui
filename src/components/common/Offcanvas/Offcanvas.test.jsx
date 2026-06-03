// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/Offcanvas/Offcanvas.test.jsx
/**
 * Tests: Offcanvas — lógica completa de ui-core offcanvas.js
 * Iniciativa: implementar-componentes-diferidos-ui-core
 */
import { render, screen, fireEvent } from '@testing-library/react';
import Offcanvas from './Offcanvas';

describe('Offcanvas', () => {
  it('no renderiza cuando open=false', () => {
    render(<Offcanvas open={false} onClose={jest.fn()}><p>Contenido</p></Offcanvas>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renderiza con role=dialog y aria-modal cuando open=true', () => {
    render(<Offcanvas open onClose={jest.fn()}><p>Panel</p></Offcanvas>);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('muestra el backdrop cuando backdrop=true (default de ui-core)', () => {
    render(<Offcanvas open onClose={jest.fn()}><p>Panel</p></Offcanvas>);
    // El backdrop tiene aria-hidden y no es un rol — verificar que existe en el DOM
    const backdrop = document.querySelector('[aria-hidden=true]');
    expect(backdrop).toBeInTheDocument();
  });

  it('backdrop=false NO muestra el backdrop', () => {
    render(<Offcanvas open backdrop={false} onClose={jest.fn()}><p>Panel</p></Offcanvas>);
    expect(document.querySelector('[aria-hidden=true]')).not.toBeInTheDocument();
  });

  it('click en backdrop llama onClose cuando backdrop=true', () => {
    const onClose = jest.fn();
    render(<Offcanvas open onClose={onClose}><p>Panel</p></Offcanvas>);
    fireEvent.click(document.querySelector('[aria-hidden=true]'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('backdrop=static NO llama onClose al click — llama onHidePrevented', () => {
    const onClose = jest.fn();
    const onHidePrevented = jest.fn();
    render(
      <Offcanvas open backdrop="static" onClose={onClose} onHidePrevented={onHidePrevented}>
        <p>Panel</p>
      </Offcanvas>
    );
    fireEvent.click(document.querySelector('[aria-hidden=true]'));
    expect(onClose).not.toHaveBeenCalled();
    expect(onHidePrevented).toHaveBeenCalledTimes(1);
  });

  it('keyboard=true cierra con Escape (default de ui-core)', () => {
    const onClose = jest.fn();
    render(<Offcanvas open keyboard onClose={onClose}><p>Panel</p></Offcanvas>);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keyboard=false NO cierra con Escape — llama onHidePrevented', () => {
    const onClose = jest.fn();
    const onHidePrevented = jest.fn();
    render(
      <Offcanvas open keyboard={false} onClose={onClose} onHidePrevented={onHidePrevented}>
        <p>Panel</p>
      </Offcanvas>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
    expect(onHidePrevented).toHaveBeenCalledTimes(1);
  });

  it('llama onShow al abrir', () => {
    const onShow = jest.fn();
    render(<Offcanvas open onShow={onShow} onClose={jest.fn()}><p>Panel</p></Offcanvas>);
    expect(onShow).toHaveBeenCalledTimes(1);
  });
});
