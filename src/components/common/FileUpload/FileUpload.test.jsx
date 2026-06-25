/**
 * Tests — FileUpload.jsx
 * Patron portado de @progress/kno-react-upload.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import FileUpload from './FileUpload';

function makeFile(name = 'test.png', size = 1024, type = 'image/png') {
  return new File(['x'.repeat(size)], name, { type });
}

describe('FileUpload', () => {
  it('renders trigger button with default label', () => {
    render(<FileUpload value={[]} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /seleccionar archivo/i })).toBeInTheDocument();
  });

  it('renders custom label', () => {
    render(<FileUpload value={[]} onChange={() => {}} label="Subir imagen" />);
    expect(screen.getByRole('button', { name: /subir imagen/i })).toBeInTheDocument();
  });

  it('shows hint text when provided', () => {
    render(<FileUpload value={[]} onChange={() => {}} hint="Solo JPG o PNG" />);
    expect(screen.getByText('Solo JPG o PNG')).toBeInTheDocument();
  });

  it('shows external error as alert', () => {
    render(<FileUpload value={[]} onChange={() => {}} error="Archivo muy grande" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Archivo muy grande');
  });

  it('lists selected files with name and size', () => {
    const files = [makeFile('foto.png', 2048)];
    render(<FileUpload value={files} onChange={() => {}} />);
    expect(screen.getByText('foto.png')).toBeInTheDocument();
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
  });

  it('calls onChange with remaining files when a file is removed', () => {
    const onChange = jest.fn();
    const files = [makeFile('a.png'), makeFile('b.png')];
    render(<FileUpload value={files} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /quitar a\.png/i }));
    expect(onChange).toHaveBeenCalledWith([files[1]]);
  });

  it('filters files exceeding maxSizeBytes', () => {
    const onChange = jest.fn();
    render(<FileUpload value={[]} onChange={onChange} maxSizeBytes={500} multiple />);
    const input = document.querySelector('input[type="file"]');
    const bigFile   = makeFile('big.png',   1000);
    const smallFile = makeFile('small.png', 400);
    fireEvent.change(input, { target: { files: [bigFile, smallFile] } });
    expect(onChange).toHaveBeenCalledWith([smallFile]);
  });

  it('disables trigger button when disabled prop is set', () => {
    render(<FileUpload value={[]} onChange={() => {}} disabled />);
    expect(screen.getByRole('button', { name: /seleccionar archivo/i })).toBeDisabled();
  });

  it('does not render file list when value is empty', () => {
    render(<FileUpload value={[]} onChange={() => {}} />);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
