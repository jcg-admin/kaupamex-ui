/**
 * Tests — RichTextEditor (adaptación nativa)
 *
 * Verifica el contrato: toolbar presente, emisión de HTML SANITIZADO al editar,
 * normalización a '' cuando queda vacío, y render del valor inicial.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import RichTextEditor from './RichTextEditor';

function getEditor() {
  return screen.getByRole('textbox');
}

describe('RichTextEditor', () => {
  it('renderiza la toolbar de formato', () => {
    render(<RichTextEditor value="" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /Negrita/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cursiva/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Subrayado/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tachado/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Subíndice/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Superíndice/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Título 1/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Título 2/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Título 3/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Cita$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Insertar enlace/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Quitar enlace/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Insertar imagen/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lista con viñetas/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lista numerada/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Quitar formato/i })).toBeInTheDocument();
  });

  it('renderiza el valor inicial (HTML sanitizado)', () => {
    render(<RichTextEditor value="<p>Hola <strong>mundo</strong></p>" onChange={() => {}} />);
    expect(getEditor()).toHaveTextContent('Hola mundo');
  });

  it('emite HTML sanitizado al editar (elimina <script>)', () => {
    const onChange = jest.fn();
    render(<RichTextEditor value="" onChange={onChange} />);
    const editor = getEditor();
    editor.innerHTML = '<p>seguro</p><script>alert(1)</script>';
    fireEvent.input(editor);
    expect(onChange).toHaveBeenCalled();
    const emitted = onChange.mock.calls.at(-1)[0];
    expect(emitted).toContain('seguro');
    expect(emitted.toLowerCase()).not.toContain('<script');
  });

  it('normaliza a cadena vacía cuando no hay texto visible', () => {
    const onChange = jest.fn();
    render(<RichTextEditor value="" onChange={onChange} />);
    const editor = getEditor();
    editor.innerHTML = '<p><br></p>';
    fireEvent.input(editor);
    expect(onChange).toHaveBeenLastCalledWith('');
  });

  it('expone .focus() por ref', () => {
    const ref = { current: null };
    render(<RichTextEditor ref={ref} value="" onChange={() => {}} />);
    expect(typeof ref.current.focus).toBe('function');
  });
});
