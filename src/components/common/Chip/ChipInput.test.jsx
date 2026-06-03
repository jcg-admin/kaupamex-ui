// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/Chip/ChipInput.test.jsx
/**
 * Tests: ChipInput — lógica completa de ui-core chip-input.js
 * Iniciativa: implementar-componentes-diferidos-ui-core
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { createRef } from 'react';
import ChipInput from './ChipInput';

describe('ChipInput', () => {
  it('renderiza el input vacío', () => {
    render(<ChipInput placeholder="Agregar etiqueta" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('Enter añade un chip y limpia el input', () => {
    render(<ChipInput />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'React' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(input.value).toBe('');
  });

  it('no añade duplicados', () => {
    render(<ChipInput />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'React' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.change(input, { target: { value: 'React' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getAllByText('React')).toHaveLength(1);
  });

  it('maxChips limita el número de chips (default ui-core: null)', () => {
    render(<ChipInput maxChips={2} />);
    const input = screen.getByRole('textbox');
    ['A', 'B', 'C'].forEach(v => {
      fireEvent.change(input, { target: { value: v } });
      fireEvent.keyDown(input, { key: 'Enter' });
    });
    expect(screen.queryByText('C')).not.toBeInTheDocument();
  });

  it('Backspace en campo vacío elimina el último chip', () => {
    render(<ChipInput />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Oshún' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByText('Oshún')).toBeInTheDocument();
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(screen.queryByText('Oshún')).not.toBeInTheDocument();
  });

  it('createOnBlur=true crea chip al perder foco (default ui-core)', () => {
    render(<ChipInput createOnBlur />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Yemayá' } });
    fireEvent.blur(input);
    expect(screen.getByText('Yemayá')).toBeInTheDocument();
  });

  it('paste con separador divide en múltiples chips (equivale a _handlePaste)', () => {
    const { container } = render(<ChipInput separator="," />);
    const input = screen.getByRole('textbox');
    fireEvent.paste(input, {
      clipboardData: { getData: () => 'React,Vue,Angular' },
    });
    // Los chips se renderizan en spans — buscar por texto en el container
    const chips = container.querySelectorAll('span');
    const labels = [...chips].map(s => s.textContent?.trim()).filter(Boolean);
    expect(labels).toContain('React');
    expect(labels).toContain('Vue');
    expect(labels).toContain('Angular');
  });

  it('ref.add() / ref.remove() / ref.clear() / ref.getValues() via imperativeHandle', () => {
    const ref = createRef();
    const { container } = render(<ChipInput ref={ref} />);
    act(() => { ref.current.add('Alpha'); ref.current.add('Beta'); });
    let chips = [...container.querySelectorAll('span')]
      .map(s => s.textContent?.trim()).filter(Boolean);
    expect(chips).toContain('Alpha');
    expect(ref.current.getValues()).toEqual(['Alpha', 'Beta']);
    act(() => { ref.current.remove('Alpha'); });
    chips = [...container.querySelectorAll('span')]
      .map(s => s.textContent?.trim()).filter(Boolean);
    expect(chips).not.toContain('Alpha');
    act(() => { ref.current.clear(); });
    chips = [...container.querySelectorAll('span')]
      .map(s => s.textContent?.trim()).filter(Boolean);
    expect(chips).not.toContain('Beta');
  });

  it('onAdd devuelve false cancela la adición (defaultPrevented)', () => {
    const onAdd = jest.fn(() => false);
    render(<ChipInput onAdd={onAdd} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Cancelado' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.queryByText('Cancelado')).not.toBeInTheDocument();
  });
});
