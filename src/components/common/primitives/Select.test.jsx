/**
 * Select primitive — T-214 (party migration). Comparte label/error/hint/a11y
 * con Field (mismas clases fieldInput/fieldError/fieldHint, DRY).
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from './index';

describe('Select', () => {
  it('renderiza un <select> con placeholder + opciones', () => {
    render(
      <Select
        label="Colonia"
        value=""
        onChange={() => {}}
        placeholder="Selecciona…"
        options={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]}
      />,
    );
    const select = screen.getByLabelText(/colonia/i);
    expect(select.tagName).toBe('SELECT');
    expect(screen.getByRole('option', { name: 'Selecciona…' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'A' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'B' })).toBeInTheDocument();
  });

  it('acepta opciones como array de strings', () => {
    render(
      <Select label="X" value="" onChange={() => {}} options={['uno', 'dos']} />,
    );
    expect(screen.getByRole('option', { name: 'uno' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'dos' })).toBeInTheDocument();
  });

  it('dispara onChange al elegir una opcion', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <Select
        label="Colonia"
        value=""
        onChange={onChange}
        options={[{ value: 'a', label: 'A' }]}
      />,
    );
    await user.selectOptions(screen.getByLabelText(/colonia/i), 'a');
    expect(onChange).toHaveBeenCalled();
  });

  it('required marca aria-required y asterisco (paridad con Field)', () => {
    render(<Select label="Colonia" required value="" onChange={() => {}} options={[]} />);
    expect(screen.getByLabelText(/colonia/i)).toHaveAttribute('aria-required', 'true');
    expect(screen.getByText('Colonia').textContent).toContain('*');
  });

  it('error enlaza aria-invalid + aria-describedby al mensaje (paridad con Field)', () => {
    render(
      <Select label="Colonia" error="Selecciona una colonia" value="" onChange={() => {}} options={[]} />,
    );
    const select = screen.getByLabelText(/colonia/i);
    expect(select).toHaveAttribute('aria-invalid', 'true');
    const msg = screen.getByText('Selecciona una colonia');
    expect(select.getAttribute('aria-describedby')).toBe(msg.getAttribute('id'));
  });
});
