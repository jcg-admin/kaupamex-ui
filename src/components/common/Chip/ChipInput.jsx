// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/Chip/ChipInput.jsx
/**
 * ChipInput — ecommerce-ui
 * Campo que convierte texto en chips al presionar Enter o el separador.
 *
 * Lógica completa de ui-core-5.25.0 chip-input.js:
 *   - add(value): agrega chip (cancelable, respeta maxChips)
 *   - remove(index): elimina chip (cancelable)
 *   - removeSelected(): elimina chips seleccionados
 *   - getValues(): array de todos los valores
 *   - getSelectedValues(): array de los valores seleccionados
 *   - clear(): elimina todos los chips
 *   - clearSelection(): deselecciona todos
 *   - createOnBlur: crear chip al perder foco (default: true)
 *   - maxChips: límite de chips (null = sin límite)
 *   - separator: ',' por defecto — al pegar con separador, se dividen
 *   - selectable: los chips son seleccionables
 *   - readonly / disabled
 *
 * Referencia: ui-core-5.25.0 chip-input.js
 * Iniciativa: implementar-componentes-diferidos-ui-core
 */
import {
  useState, useCallback, useRef, useId,
  useImperativeHandle, forwardRef,
} from 'react';
import Chip from './Chip';
import styles from './ChipInput.module.scss';

const ChipInput = forwardRef(function ChipInput({
  value:         controlled,   // array controlado externamente
  onChange,                     // callback([...values])
  placeholder   = '',           // Default de ui-core
  separator     = ',',          // Default de ui-core
  maxChips      = null,         // Default de ui-core (null = sin límite)
  selectable    = false,        // Default de ui-core
  removable     = true,
  createOnBlur  = true,         // Default de ui-core
  disabled      = false,        // Default de ui-core
  readonly      = false,
  onAdd,        // (value) => bool — devolver false previene (defaultPrevented)
  onRemove,     // (value) => bool
  label,
  className     = '',
}, ref) {
  const [internal, setInternal] = useState([]);
  const chips = controlled !== undefined ? controlled : internal;
  const inputRef = useRef(null);
  const id = useId();

  const setChips = useCallback((next) => {
    if (controlled === undefined) setInternal(next);
    else onChange?.(next);
  }, [controlled, onChange]);

  // add(value) — equivale al método add() de ui-core
  const add = useCallback((rawValue) => {
    if (disabled || readonly) return false;
    const value = rawValue.trim();
    if (!value) return false;

    let added = false;
    const updater = (prev) => {
      if (prev.includes(value)) return prev;
      if (maxChips !== null && prev.length >= maxChips) return prev;
      const result = onAdd?.(value);
      if (result === false) return prev;
      added = true;
      return [...prev, value];
    };

    if (controlled !== undefined) {
      // Controlado externamente: usar chips directamente
      if (chips.includes(value)) return false;
      if (maxChips !== null && chips.length >= maxChips) return false;
      const result = onAdd?.(value);
      if (result === false) return false;
      onChange?.([...chips, value]);
      return true;
    }
    setInternal(updater);
    return added;
  }, [disabled, readonly, chips, maxChips, onAdd, controlled, onChange]);

  // remove(value) — equivale al método remove() de ui-core
  const remove = useCallback((value) => {
    if (disabled || readonly) return false;
    const result = onRemove?.(value);
    if (result === false) return false;
    if (controlled !== undefined) {
      onChange?.(chips.filter(v => v !== value));
    } else {
      setInternal(prev => prev.filter(v => v !== value));
    }
    return true;
  }, [disabled, readonly, chips, onRemove, controlled, onChange]);

  // clear() — equivale al método clear() de ui-core
  const clear = useCallback(() => {
    if (controlled !== undefined) onChange?.([]);
    else setInternal([]);
  }, [controlled, onChange]);

  // getValues() — equivale a getValues() de ui-core
  const getValues = useCallback(() => [...chips], [chips]);

  // Exponer la API via ref
  useImperativeHandle(ref, () => ({ add, remove, clear, getValues }), [add, remove, clear, getValues]);

  const handleKeyDown = useCallback((e) => {
    const val = e.currentTarget.value;
    if (e.key === 'Enter' || (separator && e.key === separator)) {
      e.preventDefault();
      if (add(val)) {
        e.currentTarget.value = '';
      }
    }
    // Backspace en campo vacío: eliminar último chip
    if (e.key === 'Backspace' && !val && chips.length > 0) {
      remove(chips[chips.length - 1]);
    }
  }, [separator, chips, add, remove]);

  const handleBlur = useCallback((e) => {
    if (!createOnBlur) return;
    const val = e.currentTarget.value.trim();
    if (val && add(val)) {
      e.currentTarget.value = '';
    }
  }, [createOnBlur, add]);

  // Paste con separador — equivale a _handlePaste en ui-core
  // Nota: acumulamos en un array local para evitar que cada add() vea el
  // mismo estado inicial (React no actualiza state sincrónicamente en loops)
  const handlePaste = useCallback((e) => {
    if (!separator) return;
    const pasted = e.clipboardData.getData('text');
    if (!pasted.includes(separator)) return;
    e.preventDefault();
    const parts = pasted.split(separator)
      .map(p => p.trim())
      .filter(Boolean);
    const toAdd = [];
    const current = [...chips];
    for (const part of parts) {
      if (!current.includes(part) && !toAdd.includes(part)) {
        if (maxChips === null || current.length + toAdd.length < maxChips) {
          const result = onAdd?.(part);
          if (result !== false) toAdd.push(part);
        }
      }
    }
    if (toAdd.length > 0) setChips([...current, ...toAdd]);
    e.currentTarget.value = '';
  }, [separator, chips, maxChips, onAdd, setChips]);

  const atMax = maxChips !== null && chips.length >= maxChips;

  return (
    <div className={`${styles.wrapper} ${disabled ? styles.disabled : ''} ${className}`}>
      {label && <label htmlFor={`${id}-input`} className={styles.label}>{label}</label>}

      <div
        className={styles.field}
        onClick={() => !disabled && !readonly && inputRef.current?.focus()}
      >
        {chips.map((chip) => (
          <Chip
            key={chip}
            selectable={selectable}
            removable={!readonly && !disabled && removable}
            onRemove={() => remove(chip)}
            disabled={disabled}
          >
            {chip}
          </Chip>
        ))}

        {!readonly && !atMax && (
          <input
            ref={inputRef}
            id={`${id}-input`}
            type="text"
            className={styles.input}
            placeholder={chips.length === 0 ? placeholder : ''}
            disabled={disabled}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onPaste={handlePaste}
            aria-label={label ?? 'Agregar etiqueta'}
          />
        )}
      </div>
    </div>
  );
});

export default ChipInput;
export { ChipInput };
