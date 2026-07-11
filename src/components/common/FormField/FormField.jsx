// Adaptado de @progress/kno-react-labels (Label/Hint/Error) +
// @progress/kno-react-form (FieldWrapper/FormElement) — referencia no runtime.
// Reimplementacion nativa del contrato publico: un wrapper composable que
// enlaza label + hint + error con a11y (htmlFor, aria-describedby, aria-invalid)
// alrededor de un control arbitrario (input, PasswordInput, DatePicker, ...).
// A diferencia del primitivo `Field` (que empaqueta su propio <input>), este
// envuelve cualquier control hijo via cloneElement — no lo reemplaza.
import { Children, cloneElement, isValidElement, useId } from 'react';
import styles from './FormField.module.scss';

// Sub-parte: la etiqueta. `editorId` enlaza con el control (kno: Label.editorId).
export function Label({ editorId, required = false, className, children }) {
  return (
    <label htmlFor={editorId} className={[styles.label, className].filter(Boolean).join(' ')}>
      {children}
      {required && <span className={styles.required} aria-hidden="true"> *</span>}
    </label>
  );
}

// Sub-parte: la ayuda contextual (kno: Hint). Se oculta cuando hay error para
// no competir por el aria-describedby ni duplicar mensajes.
export function Hint({ id, className, children }) {
  if (!children) return null;
  return (
    <span id={id} className={[styles.hint, className].filter(Boolean).join(' ')}>
      {children}
    </span>
  );
}

// Sub-parte: el mensaje de error (kno: Error). role="alert" para que el lector
// de pantalla lo anuncie al aparecer.
export function FieldError({ id, className, children }) {
  if (!children) return null;
  return (
    <span id={id} role="alert" className={[styles.error, className].filter(Boolean).join(' ')}>
      {children}
    </span>
  );
}

/**
 * FormField — wrapper de campo con label + hint + error accesibles.
 *
 * Envuelve UN control hijo y le inyecta:
 *  - `id` (el que enlaza el `htmlFor` del label), si el hijo no trae uno propio;
 *  - `aria-describedby` con los ids de hint y/o error (respeta el que ya traiga);
 *  - `aria-invalid` cuando hay error.
 *
 * @param {string}   label     texto de la etiqueta
 * @param {boolean}  required  marca visual `*` (comunicado por aria-required del hijo)
 * @param {string}   hint      ayuda contextual (se oculta si hay error)
 * @param {string}   error     mensaje de error (activa aria-invalid + role=alert)
 * @param {string}   controlId id explicito; si se omite se genera con useId()
 */
export default function FormField({
  label,
  required = false,
  hint = null,
  error = null,
  controlId,
  className,
  children,
}) {
  const autoId = useId();
  const id = controlId ?? autoId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const showHint = Boolean(hint) && !error;

  const child = Children.only(children);

  let control = child;
  if (isValidElement(child)) {
    // Compone el aria-describedby: preserva el que el hijo ya declare y agrega
    // el del error (prioritario) o el del hint. Nunca pisa un id propio del hijo.
    const describedBy = [
      child.props['aria-describedby'],
      error ? errorId : null,
      showHint ? hintId : null,
    ].filter(Boolean).join(' ') || undefined;

    control = cloneElement(child, {
      id: child.props.id ?? id,
      'aria-describedby': describedBy,
      'aria-invalid': error ? true : child.props['aria-invalid'],
    });
  }

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      {label && <Label editorId={id} required={required}>{label}</Label>}
      {control}
      <FieldError id={errorId}>{error}</FieldError>
      {showHint && <Hint id={hintId}>{hint}</Hint>}
    </div>
  );
}
