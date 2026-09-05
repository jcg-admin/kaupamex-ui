// Adaptado de @progress/kno-react-dropdowns (ComboBox) — referencia no runtime.
// Reimplementa nativo el contrato público de kno ComboBox (data, value,
// onChange({value}), filterable, filter, onFilterChange({filter}), onClose,
// textField, dataItemKey, placeholder, label, clearButton, loading, disabled,
// allowCustom, suggest). No se instala @progress/*; se lee la fuente de
// /-progress como referencia (regla adaptacion-componentes-nativa).
//
// Nota de contrato (regla adaptacion-componentes-nativa, caso inverso): un
// ComboBox NUEVO no tiene consumidores previos que preservar, así que el
// contrato público se fija para *igualar el ejemplo kno del ejecutor*
// (onChange recibe `{ value }`, onFilterChange recibe `{ filter: { value } }`).
// Los consumidores se escriben contra este contrato, no al revés.
/**
 * ComboBox — Kaupamex UI
 *
 * Selector editable con lista desplegable filtrable. A diferencia de
 * Autocomplete (búsqueda de texto libre), el ComboBox está anclado a una
 * `data` de opciones y devuelve el *item* seleccionado, no una cadena.
 *
 * Filtrado en el consumidor (patrón kno): el ComboBox emite `onFilterChange`
 * con un FilterDescriptor; el consumidor usa `filterBy(all, e.filter)` de
 * `src/lib/dataQuery` para recalcular `data`. Si `filterable` es false, la
 * lista se muestra completa.
 */
import {
  useState, useRef, useMemo, useCallback, useId,
} from 'react';
import useClickOutside from '@hooks/ui/useClickOutside';
import useEscapeKey from '@hooks/ui/useEscapeKey';
import Icon from '@components/common/Icon/Icon';
import Loader from '@components/common/Loader/Loader';
import styles from './ComboBox.module.scss';

const textOf = (item, textField) => {
  if (item == null) return '';
  if (typeof item === 'string' || typeof item === 'number') return String(item);
  return textField && item[textField] != null ? String(item[textField]) : '';
};

const keyOf = (item, dataItemKey, textField, idx) => {
  if (item == null) return `empty-${idx}`;
  if (typeof item === 'string' || typeof item === 'number') return String(item);
  if (dataItemKey && item[dataItemKey] != null) return String(item[dataItemKey]);
  return `${textOf(item, textField)}-${idx}`;
};

const sameItem = (a, b, dataItemKey) => {
  if (a == null || b == null) return a === b;
  if (typeof a !== 'object' || typeof b !== 'object') return a === b;
  if (dataItemKey) return a[dataItemKey] === b[dataItemKey];
  return a === b;
};

export default function ComboBox({
  data = [],
  value = null,
  onChange,
  filterable = false,
  filter = null,
  onFilterChange,
  onClose,
  onOpen,
  textField,
  dataItemKey,
  placeholder = '',
  label,
  clearButton = true,
  loading = false,
  disabled = false,
  allowCustom = false,
  suggest = false,
  required = false,
  name,
  id: externalId,
  ariaLabel,
  className = '',
  filterOperator = 'contains',
}) {
  const generatedId = useId();
  const inputId = externalId ?? `cb-${generatedId.replace(/:/g, '')}`;
  const listId = `${inputId}-list`;

  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  // Texto tecleado sólo cuando el filtrado es local (no controlado por `filter`).
  const [localText, setLocalText] = useState('');

  const rootRef = useRef(null);
  const inputRef = useRef(null);

  // El texto mostrado en el input: el filtro controlado si existe, si no el
  // texto local en edición, o el textField del value seleccionado.
  const controlledFilterText = filter && typeof filter === 'object' ? filter.value ?? '' : '';
  const inputText = filterable
    ? (controlledFilterText !== '' || localText !== '' ? (controlledFilterText || localText) : textOf(value, textField))
    : textOf(value, textField);

  const close = useCallback(() => {
    setOpen(false);
    setActiveIdx(-1);
    onClose?.();
  }, [onClose]);

  const openList = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    onOpen?.();
  }, [disabled, onOpen]);

  useClickOutside(rootRef, () => { if (open) close(); }, open);
  useEscapeKey(() => { if (open) close(); }, open);

  const emitFilter = useCallback((text) => {
    if (!onFilterChange) return;
    onFilterChange({
      filter: {
        field: textField,
        operator: filterOperator,
        value: text,
        ignoreCase: true,
      },
    });
  }, [onFilterChange, textField, filterOperator]);

  const commit = useCallback((item) => {
    onChange?.({ value: item });
    setLocalText('');
    close();
  }, [onChange, close]);

  const handleInput = (e) => {
    const text = e.target.value;
    if (!open) openList();
    if (filterable) {
      if (onFilterChange) emitFilter(text);
      else setLocalText(text);
    }
  };

  const handleBlurCommit = () => {
    if (!allowCustom) return;
    const text = inputRef.current?.value ?? '';
    if (text && !sameItem(value, text, dataItemKey)) onChange?.({ value: text });
  };

  const clear = () => {
    onChange?.({ value: null });
    setLocalText('');
    if (onFilterChange) emitFilter('');
    inputRef.current?.focus();
  };

  // Sugerencia inline (suggest): primer item cuyo texto empieza por lo tecleado.
  const suggestion = useMemo(() => {
    if (!suggest || !filterable || !inputText) return '';
    const hit = data.find((it) => textOf(it, textField).toLowerCase().startsWith(inputText.toLowerCase()));
    return hit ? textOf(hit, textField) : '';
  }, [suggest, filterable, inputText, data, textField]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) { openList(); return; }
      setActiveIdx((i) => Math.min(i + 1, data.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && activeIdx >= 0 && activeIdx < data.length) {
        e.preventDefault();
        commit(data[activeIdx]);
      } else if (open && suggestion) {
        e.preventDefault();
        const hit = data.find((it) => textOf(it, textField) === suggestion);
        if (hit) commit(hit);
      }
    }
  };

  return (
    <div className={`${styles.wrap} ${className}`.trim()} ref={rootRef}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && <span className={styles.required} aria-hidden="true"> *</span>}
        </label>
      )}
      <div className={`${styles.control}${disabled ? ` ${styles.disabled}` : ''}${open ? ` ${styles.open}` : ''}`}>
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="text"
          className={styles.input}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete={filterable ? 'list' : 'none'}
          aria-label={ariaLabel}
          aria-required={required || undefined}
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          value={inputText}
          readOnly={!filterable}
          onChange={handleInput}
          onFocus={openList}
          onClick={openList}
          onBlur={handleBlurCommit}
          onKeyDown={handleKeyDown}
        />
        {loading && <span className={styles.loading}><Loader type="pulsing" size="small" ariaLabel="Cargando opciones" /></span>}
        {clearButton && !loading && (value != null || inputText !== '') && !disabled && (
          <button type="button" className={styles.clear} onClick={clear} aria-label="Limpiar selección" tabIndex={-1}>
            <Icon name="x" size={14} />
          </button>
        )}
        <button
          type="button"
          className={styles.toggle}
          onClick={() => (open ? close() : openList())}
          aria-label={open ? 'Cerrar opciones' : 'Abrir opciones'}
          disabled={disabled}
          tabIndex={-1}
        >
          <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} />
        </button>
      </div>

      {open && (
        <ul id={listId} role="listbox" className={styles.list} aria-label={label || ariaLabel || 'Opciones'}>
          {data.length === 0 && (
            <li className={styles.empty} role="option" aria-disabled="true">Sin resultados</li>
          )}
          {data.map((item, i) => {
            const selected = sameItem(value, item, dataItemKey);
            return (
              <li
                key={keyOf(item, dataItemKey, textField, i)}
                role="option"
                aria-selected={selected}
                className={`${styles.option}${i === activeIdx ? ` ${styles.active}` : ''}${selected ? ` ${styles.selected}` : ''}`}
                onMouseDown={(e) => { e.preventDefault(); commit(item); }}
                onMouseEnter={() => setActiveIdx(i)}
              >
                {textOf(item, textField)}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
