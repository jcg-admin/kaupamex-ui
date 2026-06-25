/**
 * Tests — ExternalDropZone.jsx
 * Patron portado de @progress/kno-react-upload.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import ExternalDropZone from './ExternalDropZone';

describe('ExternalDropZone', () => {
  it('renders default hint text', () => {
    render(<ExternalDropZone onChange={() => {}} />);
    expect(screen.getByText(/arrastra archivos aquí/i)).toBeInTheDocument();
  });

  it('renders custom hint', () => {
    render(<ExternalDropZone onChange={() => {}} hint="Suelta el CSV aquí" />);
    expect(screen.getByText('Suelta el CSV aquí')).toBeInTheDocument();
  });

  it('renders children instead of default hint', () => {
    render(
      <ExternalDropZone onChange={() => {}}>
        <span>Zona personalizada</span>
      </ExternalDropZone>,
    );
    expect(screen.getByText('Zona personalizada')).toBeInTheDocument();
    expect(screen.queryByText(/arrastra archivos/i)).not.toBeInTheDocument();
  });

  it('calls onChange with all dropped files when multiple is true', () => {
    const onChange = jest.fn();
    render(<ExternalDropZone onChange={onChange} multiple />);
    const zone = screen.getByRole('region');
    const files = [
      new File(['a'], 'a.png', { type: 'image/png' }),
      new File(['b'], 'b.png', { type: 'image/png' }),
    ];
    fireEvent.drop(zone, { dataTransfer: { files } });
    expect(onChange).toHaveBeenCalledWith(files);
  });

  it('only passes first file when multiple is false', () => {
    const onChange = jest.fn();
    render(<ExternalDropZone onChange={onChange} multiple={false} />);
    const zone = screen.getByRole('region');
    const files = [
      new File(['a'], 'a.png', { type: 'image/png' }),
      new File(['b'], 'b.png', { type: 'image/png' }),
    ];
    fireEvent.drop(zone, { dataTransfer: { files } });
    expect(onChange).toHaveBeenCalledWith([files[0]]);
  });

  it('does not call onChange when disabled', () => {
    const onChange = jest.fn();
    render(<ExternalDropZone onChange={onChange} disabled />);
    const zone = screen.getByRole('region');
    const file = new File(['data'], 'test.png', { type: 'image/png' });
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    expect(onChange).not.toHaveBeenCalled();
  });
});
