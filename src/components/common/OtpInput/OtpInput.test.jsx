import { render, screen, fireEvent } from '@testing-library/react';
import OtpInput from './OtpInput';

describe('OtpInput', () => {
  function setup(overrides = {}) {
    const onChange = jest.fn();
    render(<OtpInput value="" onChange={onChange} {...overrides} />);
    return { onChange };
  }

  it('renders default 6 inputs', () => {
    setup();
    expect(screen.getAllByRole('textbox')).toHaveLength(6);
  });

  it('renders custom length', () => {
    setup({ length: 4 });
    expect(screen.getAllByRole('textbox')).toHaveLength(4);
  });

  it('displays value digits in each cell', () => {
    setup({ length: 4, value: '1234' });
    const inputs = screen.getAllByRole('textbox');
    expect(inputs[0]).toHaveValue('1');
    expect(inputs[1]).toHaveValue('2');
    expect(inputs[2]).toHaveValue('3');
    expect(inputs[3]).toHaveValue('4');
  });

  it('advances focus to next cell after typing', () => {
    setup({ length: 4 });
    const inputs = screen.getAllByRole('textbox');
    inputs[0].focus();
    fireEvent.change(inputs[0], { target: { value: '5' } });
    expect(document.activeElement).toBe(inputs[1]);
  });

  it('calls onChange with updated full value', () => {
    const { onChange } = setup({ length: 4, value: '1' });
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[1], { target: { value: '2' } });
    expect(onChange).toHaveBeenCalledWith('12');
  });

  it('clears filled cell on Backspace', () => {
    const { onChange } = setup({ length: 4, value: '1234' });
    const inputs = screen.getAllByRole('textbox');
    inputs[3].focus();
    fireEvent.keyDown(inputs[3], { key: 'Backspace' });
    expect(onChange).toHaveBeenCalledWith('123');
  });

  it('moves focus back on Backspace from empty cell', () => {
    const { onChange } = setup({ length: 4, value: '123' });
    const inputs = screen.getAllByRole('textbox');
    inputs[3].focus();
    fireEvent.keyDown(inputs[3], { key: 'Backspace' });
    expect(document.activeElement).toBe(inputs[2]);
    expect(onChange).toHaveBeenCalledWith('12');
  });

  it('distributes paste from first input', () => {
    const { onChange } = setup({ length: 4 });
    const inputs = screen.getAllByRole('textbox');
    fireEvent.paste(inputs[0], {
      clipboardData: { getData: () => '1234' },
    });
    expect(onChange).toHaveBeenCalledWith('1234');
  });

  it('distributes paste starting from current index', () => {
    const { onChange } = setup({ length: 4, value: '1' });
    const inputs = screen.getAllByRole('textbox');
    fireEvent.paste(inputs[1], {
      clipboardData: { getData: () => '23' },
    });
    expect(onChange).toHaveBeenCalledWith('123');
  });

  it('ignores non-numeric characters on input', () => {
    const { onChange } = setup({ length: 4 });
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'a' } });
    expect(onChange).not.toHaveBeenCalled();
  });
});
