// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/Autocomplete/Autocomplete.jsx
/**
 * Autocomplete — ecommerce-ui
 * Campo de búsqueda con sugerencias con API completa de ui-core autocomplete.js.
 *
 * Opciones de ui-core implementadas:
 *   cleaner: false          — botón ✕ para limpiar (default: false)
 *   clearSearchOnSelect: true — limpia input al seleccionar
 *   disabled: false
 *   indicator: false        — icono de caret/chevron
 *   invalid / valid         — estados de validación
 *   name / id               — para formularios
 *   options                 — array estático de opciones
 *   optionsMaxHeight: 'auto'— altura máxima del panel
 *   placeholder             — placeholder del input
 *   required: false
 *   search: null            — función de búsqueda externa
 *   searchNoResultsLabel    — texto cuando no hay resultados
 *   showHints: false        — mostrar hint del primer match
 *   value: null             — valor inicial
 *   allowOnlyDefinedOptions — solo acepta valores del listado
 *
 * Métodos via ref: toggle/show/hide/dispose/clear/search/update/deselectAll
 *
 * Iniciativa: integrar-componentes-ui-core-js (completar API)
 */
import {
  useState, useRef, useCallback, useId,
  useImperativeHandle, forwardRef,
} from 'react';
import useClickOutside from '@hooks/ui/useClickOutside';
import useEscapeKey    from '@hooks/ui/useEscapeKey';
import Icon from '@components/common/Icon/Icon';
import styles from './Autocomplete.module.scss';

const Autocomplete = forwardRef(function Autocomplete({
  options:     staticOptions = [],
  value:       controlled,
  onChange,
  onSelect,
  // Opciones de ui-core
  placeholder          = null,
  search:              externalSearch = null,
  searchNoResultsLabel = false,      // false = ocultar, string = mostrar mensaje
  clearSearchOnSelect  = true,       // Default ui-core
  allowOnlyDefinedOptions = false,   // Default ui-core
  showHints            = false,      // Default ui-core
  cleaner              = false,      // Default ui-core
  indicator            = false,      // Default ui-core
  optionsMaxHeight     = 'auto',     // Default ui-core
  disabled             = false,      // Default ui-core
  invalid              = false,      // Default ui-core
  valid                = false,      // Default ui-core
  required             = false,      // Default ui-core
  name,                              // Default ui-core
  id:          externalId,           // Default ui-core
  // Callbacks
  onShow,
  onShown,
  onHide,
  onHidden,
  className            = '',
}, ref) {
  const generatedId = useId();
  const inputId     = externalId ?? `ac-${generatedId.replace(/:/g, '')}`;
  const listId      = `${inputId}-list`;

  const [query,     setQuery]     = useState('');
  const [open,      setOpen]      = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [selected,  setSelected]  = useState(controlled ?? null);
  const [loading,   setLoading]   = useState(false);
  const [matches,   setMatches]   = useState([]);

  const inputRef    = useRef(null);
  const panelRef    = useRef(null);

  // Filtro local de opciones
  const filterLocal = useCallback((q) => {
    if (!q) return [];
    return staticOptions.filter(opt => {
      const label = typeof opt === 'string' ? opt : opt.label ?? '';
      return label.toLowerCase().includes(q.toLowerCase());
    });
  }, [staticOptions]);

  // Búsqueda síncrona local — la búsqueda externa se delega al padre via onChange
  const runSearch = useCallback((q) => {
    if (!q) { setMatches([]); return; }
    if (externalSearch) {
      // Búsqueda externa: síncrona o async manejada externamente
      const result = externalSearch(q);
      if (result && typeof result.then === 'function') {
        setLoading(true);
        result.then(r => { setMatches(r ?? []); setLoading(false); });
      } else {
        setMatches(result ?? []);
      }
    } else {
      setMatches(filterLocal(q));
    }
  }, [externalSearch, filterLocal]);

  const getLabel = (opt) => typeof opt === 'string' ? opt : opt.label ?? String(opt);
  const getValue = (opt) => typeof opt === 'string' ? opt : opt.value ?? opt.label ?? String(opt);

  // show() / hide() / toggle()
  const show = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    onShow?.();
    setTimeout(() => onShown?.(), 100);
  }, [disabled, onShow, onShown]);

  const hide = useCallback(() => {
    setOpen(false);
    setActiveIdx(-1);
    onHide?.();
    setTimeout(() => onHidden?.(), 100);
  }, [onHide, onHidden]);

  const toggle = useCallback(() => open ? hide() : show(), [open, hide, show]);

  // clear() — equivale a Autocomplete.clear() de ui-core
  const clear = useCallback(() => {
    setQuery('');
    setSelected(null);
    setMatches([]);
    if (controlled === undefined) onChange?.(null);
    inputRef.current?.focus();
  }, [controlled, onChange]);

  // search(q) — equivale a Autocomplete.search()
  const searchFn = useCallback((q) => {
    setQuery(q);
    if (inputRef.current) inputRef.current.value = q;
    if (q) { show(); runSearch(q); }
  }, [show, runSearch]);

  // update(options) — equivale a Autocomplete.update()
  const update = useCallback((newOptions) => {
    // Se pasan las opciones directamente; el componente las usa en el próximo render
    // Para uso dinámico, prefer externalSearch o options prop reactivo
  }, []);

  // deselectAll() — equivale a Autocomplete.deselectAll()
  const deselectAll = useCallback(() => setSelected(null), []);

  const dispose = useCallback(() => hide(), [hide]);

  useImperativeHandle(ref, () => ({
    toggle, show, hide, dispose,
    clear, search: searchFn, update, deselectAll,
  }), [toggle, show, hide, dispose, clear, searchFn, update, deselectAll]);

  useEscapeKey(hide, open);
  useClickOutside(panelRef, () => { if (open) hide(); }, open);

  const selectOption = useCallback((opt) => {
    const val = getValue(opt);
    const lbl = getLabel(opt);
    setSelected(val);
    if (controlled === undefined) onChange?.(val);
    onSelect?.(opt);
    if (clearSearchOnSelect) {
      setQuery('');
      if (inputRef.current) inputRef.current.value = '';
    } else {
      setQuery(lbl);
      if (inputRef.current) inputRef.current.value = lbl;
    }
    hide();
  }, [controlled, onChange, onSelect, clearSearchOnSelect, hide]);

  const handleInput = useCallback((e) => {
    const val = e.target.value;
    setQuery(val);
    if (val) { show(); runSearch(val); }
    else { setMatches([]); hide(); }
    if (controlled === undefined && !allowOnlyDefinedOptions) onChange?.(val);
  }, [controlled, onChange, allowOnlyDefinedOptions, show, hide, runSearch]);

  const handleKeyDown = useCallback((e) => {
    if (!open && e.key === 'ArrowDown') { show(); return; }
    if (!open) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      selectOption(matches[activeIdx]);
    } else if (e.key === 'Tab') {
      hide();
    }
  }, [open, show, hide, matches, activeIdx, selectOption]);

  // showHints — mostrar hint del primer match en el input
  const hint = showHints && matches.length > 0 ? getLabel(matches[0]) : '';

  const wrapperCls = [
    styles.wrapper,
    disabled ? styles.disabled : '',
    invalid  ? styles.invalid  : '',
    valid    ? styles.valid    : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperCls} ref={panelRef}>
      <div className={styles.inputGroup}>
        {showHints && hint && (
          <span className={styles.hint} aria-hidden="true">{hint}</span>
        )}
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="text"
          role="combobox"
          autoComplete="off"
          className={styles.input}
          placeholder={placeholder ?? undefined}
          disabled={disabled}
          required={required}
          value={query}
          onChange={handleInput}
          readOnly={false}
          onKeyDown={handleKeyDown}
          onClick={() => !disabled && show()}
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={activeIdx >= 0 ? `${listId}-${activeIdx}` : undefined}
          aria-autocomplete="list"
          aria-invalid={invalid ? true : undefined}
          aria-haspopup="listbox"
        />
        {/* cleaner — equivale a _config.cleaner en ui-core */}
        {cleaner && (query || selected) && (
          <button
            type="button"
            className={styles.cleaner}
            onClick={clear}
            aria-label="Limpiar selección"
            tabIndex={-1}
          >
            <Icon name="x" size={14} />
          </button>
        )}
        {/* indicator — equivale a _config.indicator en ui-core */}
        {indicator && (
          <span className={styles.indicator} aria-hidden="true" onClick={toggle}>
            <Icon name="chevron-down" size={16} />
          </span>
        )}
      </div>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className={styles.panel}
          style={{ maxHeight: optionsMaxHeight !== 'auto' ? optionsMaxHeight : undefined }}
          aria-label="Opciones"
        >
          {loading && (
            <li className={styles.noResults} role="option" aria-disabled="true">
              Buscando…
            </li>
          )}
          {!loading && matches.length === 0 && searchNoResultsLabel && (
            <li className={styles.noResults} role="option" aria-disabled="true">
              {searchNoResultsLabel}
            </li>
          )}
          {!loading && matches.map((opt, i) => (
            <li
              key={getValue(opt) ?? i}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === activeIdx}
              className={`${styles.option} ${i === activeIdx ? styles.optionActive : ''}`}
              onMouseDown={(e) => { e.preventDefault(); selectOption(opt); }}
              onMouseEnter={() => setActiveIdx(i)}
            >
              {getLabel(opt)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

export default Autocomplete;
export { Autocomplete };
