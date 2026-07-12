/**
 * Tests — FormField
 * Adaptado de @progress/kno-react-labels + kno-react-form — referencia no runtime.
 * Verifica el cableado a11y: htmlFor, aria-describedby (hint/error), aria-invalid,
 * role=alert, y la composicion sobre un control arbitrario.
 */
import { render, screen } from '@testing-library/react';
import FormField from './FormField';

describe('FormField', () => {
  it('enlaza el label con el control via htmlFor/id', () => {
    render(
      <FormField label="Correo">
        <input type="email" />
      </FormField>,
    );
    const input = screen.getByLabelText('Correo');
    expect(input).toBeInTheDocument();
    // el label apunta al mismo id que recibio el control
    expect(input.id).toBeTruthy();
  });

  it('usa el controlId explicito cuando se pasa', () => {
    render(
      <FormField label="Correo" controlId="email-field">
        <input type="email" />
      </FormField>,
    );
    const input = screen.getByLabelText('Correo');
    expect(input.id).toBe('email-field');
  });

  it('muestra el hint y lo enlaza con aria-describedby', () => {
    render(
      <FormField label="Correo" hint="Usaremos esto para contactarte">
        <input type="email" />
      </FormField>,
    );
    const input = screen.getByLabelText('Correo');
    const hint = screen.getByText('Usaremos esto para contactarte');
    expect(input.getAttribute('aria-describedby')).toContain(hint.id);
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('muestra el error con role=alert, aria-invalid y aria-describedby', () => {
    render(
      <FormField label="Correo" error="Campo obligatorio">
        <input type="email" />
      </FormField>,
    );
    const input = screen.getByLabelText('Correo');
    const error = screen.getByRole('alert');
    expect(error).toHaveTextContent('Campo obligatorio');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toContain(error.id);
  });

  it('oculta el hint cuando hay error (no compiten por describedby)', () => {
    render(
      <FormField label="Correo" hint="ayuda" error="Campo obligatorio">
        <input type="email" />
      </FormField>,
    );
    expect(screen.queryByText('ayuda')).not.toBeInTheDocument();
    const input = screen.getByLabelText('Correo');
    const error = screen.getByRole('alert');
    expect(input.getAttribute('aria-describedby')).toBe(error.id);
  });

  it('marca el asterisco visual de requerido (aria-hidden)', () => {
    const { container } = render(
      <FormField label="Correo" required>
        <input type="email" />
      </FormField>,
    );
    const asterisk = container.querySelector('[aria-hidden="true"]');
    expect(asterisk).toHaveTextContent('*');
  });

  it('preserva un id propio del control hijo (no lo pisa)', () => {
    render(
      <FormField label="Correo">
        <input id="propio" type="email" />
      </FormField>,
    );
    expect(document.querySelector('input').id).toBe('propio');
  });

  it('compone el aria-describedby existente del hijo con el del error', () => {
    render(
      <FormField label="Correo" error="Campo obligatorio">
        <input type="email" aria-describedby="externo" />
      </FormField>,
    );
    const input = screen.getByLabelText('Correo');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toContain('externo');
    expect(describedBy).toContain(screen.getByRole('alert').id);
  });
});
