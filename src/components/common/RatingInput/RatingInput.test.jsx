/**
 * Tests — RatingInput
 * Portado de ui-core-5.25.0/js/src/rating.js
 */
import { render, screen, fireEvent } from '@testing-library/react';
import RatingInput from './RatingInput';

describe('RatingInput', () => {
  it('renderiza max estrellas (default 5)', () => {
    render(<RatingInput value={0} onChange={() => {}} />);
    expect(screen.getAllByRole('button')).toHaveLength(5);
  });

  it('renderiza max estrellas custom', () => {
    render(<RatingInput value={0} onChange={() => {}} max={3} />);
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('click en estrella 3 llama onChange con valor 3', () => {
    const onChange = jest.fn();
    render(<RatingInput value={0} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /3 de 5/i }));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('click en estrella 5 llama onChange con valor 5', () => {
    const onChange = jest.fn();
    render(<RatingInput value={0} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /5 de 5/i }));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('readOnly desactiva todos los botones', () => {
    render(<RatingInput value={3} onChange={() => {}} readOnly />);
    screen.getAllByRole('button').forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it('readOnly no llama onChange al hacer click', () => {
    const onChange = jest.fn();
    render(<RatingInput value={3} onChange={onChange} readOnly />);
    // buttons are disabled, click does not fire
    fireEvent.click(screen.getByRole('button', { name: /1 de 5/i }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('aria-pressed=true en la estrella activa', () => {
    render(<RatingInput value={4} onChange={() => {}} />);
    expect(
      screen.getByRole('button', { name: /4 de 5/i }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: /3 de 5/i }),
    ).toHaveAttribute('aria-pressed', 'false');
  });
});
