// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/MultiSelect/MultiSelect.jsx
/**
 * MultiSelect — ecommerce-ui
 * Selector múltiple con API completa de ui-core multi-select.js.
 *
 * Opciones de ui-core:
 *   multiple: true          — selección múltiple (default)
 *   search: false           — campo de búsqueda en el panel
 *   searchNoResultsLabel    — texto cuando no hay resultados
 *   cleaner: true           — botón ✕ para limpiar todo
 *   selectAll: true         — opción "seleccionar todo"
 *   selectAllLabel          — etiqueta del "seleccionar todo"
 *   selectionType: 'tags'   — 'tags' | 'counter' | 'text'
 *   selectionTypeCounterText— texto del contador
 *   placeholder: 'Select...'
 *   optionsMaxHeight: 'auto'
 *   optionsStyle: 'checkbox'— 'checkbox' | 'text'
 *   clearSearchOnSelect: false
 *   disabled / invalid / valid / required
 *   name / id
 *   value: null             — valor inicial
 *
 * Métodos via ref: toggle/show/hide/dispose/search/update/selectAll/deselectAll/getValue
 */
import {
  useState, useCallback, useRef, useId,
  useImperativeHandle, forwardRef,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useClickOutside from '@hooks/ui/useClickOutside';
import useEscapeKey    from '@hooks/ui/useEscapeKey';
import styles from './MultiSelect.module.scss';

const MultiSelect = forwardRef(function MultiSelect({
  options              = [],
  value:    controlled,
  onChange,
  // Opciones de ui-core
  multiple             = true,           // Default ui-core
  search               = false,          // Default ui-core
  searchNoResultsLabel = 'No results found', // Default ui-core
  cleaner              = true,           // Default ui-core
  selectAll            = true,           // Default ui-core
  selectAllLabel       = 'Select all options', // Default ui-core
  selectionType        = 'tags',         // Default ui-core: 'tags'|'counter'|'text'
  selectionTypeCounterText = 'item(s) selected', // Default ui-core
  placeholder          = 'Select...',   // Default ui-core
  optionsMaxHeight     = 'auto',
  optionsStyle         = 'checkbox',    // Default ui-core: 'checkbox'|'text'
  clearSearchOnSelect  = false,         // Default ui-core
  disabled             = false,
  invalid              = false,
  valid                = false,
  required             = false,
  name,
  id: externalId,
  onShow, onShown, onHide, onHidden,
  className            = '',
}, ref) {
  const uid     = useId();
  const inputId = externalId ?? `ms-${uid.replace(/:/g, '')}`;
  const panelId = `${inputId}-panel`;

  const [open,     setOpen]     = useState(false);
  const [selected, setSelected] = useState(() => {
    if (controlled !== undefined) return Array.isArray(controlled) ? controlled : [controlled];
    return [];
  });
  const [query,    setQuery]    = useState('');
  const panelRef = useRef(null);

  const sel = controlled !== undefined
    ? (Array.isArray(controlled) ? controlled : [controlled])
    : selected;

  const setVal = useCallback((next) => {
    if (controlled === undefined) setSelected(next);
    onChange?.(multiple ? next : next[0] ?? null);
  }, [controlled, onChange, multiple]);

  const show = useCallback(() => {
    if (disabled) return;
    setOpen(true); onShow?.();
    setTimeout(() => onShown?.(), 150);
  }, [disabled, onShow, onShown]);

  const hide = useCallback(() => {
    setOpen(false); onHide?.();
    setTimeout(() => onHidden?.(), 150);
  }, [onHide, onHidden]);

  const toggle = useCallback(() => open ? hide() : show(), [open, hide, show]);

  // selectAll() / deselectAll() — equivale a métodos públicos de ui-core
  const selectAllFn   = useCallback(() => setVal(opts().map(getValue)), []);  // eslint-disable-line
  const deselectAllFn = useCallback(() => setVal([]), [setVal]);

  // getValue() — equivale a MultiSelect.getValue() de ui-core
  const getValueFn = useCallback(() => sel, [sel]);

  // search(q) — equivale a MultiSelect.search()
  const searchFn = useCallback((q) => setQuery(q), []);

  // update() — equivale a MultiSelect.update()
  const updateFn = useCallback(() => {}, []);

  const dispose = useCallback(() => hide(), [hide]);

  useImperativeHandle(ref, () => ({
    toggle, show, hide, dispose,
    search: searchFn, update: updateFn,
    selectAll: selectAllFn, deselectAll: deselectAllFn,
    getValue: getValueFn,
  }), [toggle, show, hide, dispose, searchFn, updateFn, selectAllFn, deselectAllFn, getValueFn]);

  useEscapeKey(hide, open);
  useClickOutside(panelRef, () => { if (open) hide(); }, open);

  const getLabel = (o) => typeof o === 'string' ? o : o.label ?? String(o);
  const getValue = (o) => typeof o === 'string' ? o : o.value ?? o.label ?? String(o);
  const opts     = () => options;

  const filtered = query
    ? options.filter(o => getLabel(o).toLowerCase().includes(query.toLowerCase()))
    : options;

  const isSelected = (o) => sel.includes(getValue(o));

  const toggle_opt = useCallback((opt) => {
    const v = getValue(opt);
    if (!multiple) {
      setVal([v]);
      if (clearSearchOnSelect) setQuery('');
      hide();
      return;
    }
    const next = sel.includes(v) ? sel.filter(x => x !== v) : [...sel, v];
    setVal(next);
    if (clearSearchOnSelect) setQuery('');
  }, [sel, multiple, setVal, clearSearchOnSelect, hide]);

  // Renderizar la selección actual según selectionType
  const renderSelection = () => {
    if (sel.length === 0) return <span className={styles.placeholder}>{placeholder}</span>;
    if (selectionType === 'counter') return <span>{sel.length} {selectionTypeCounterText}</span>;
    if (selectionType === 'text')    return <span>{sel.join(', ')}</span>;
    // 'tags'
    return sel.map(v => {
      const label = getLabel(options.find(o => getValue(o) === v) ?? v);
      return (
        <span key={v} className={styles.tag}>
          {label}
          <button
            type="button"
            onClick={e => { e.stopPropagation(); setVal(sel.filter(x => x !== v)); }}
            aria-label={`Eliminar ${label}`}
            className={styles.tagRemove}
          >×</button>
        </span>
      );
    });
  };

  const allSelected = options.length > 0 && options.every(o => sel.includes(getValue(o)));

  return (
    <div
      className={[
        styles.wrapper,
        disabled ? styles.disabled : '',
        invalid  ? styles.invalid  : '',
        valid    ? styles.valid    : '',
        className,
      ].filter(Boolean).join(' ')}
      ref={panelRef}
    >
      {/* Trigger */}
      <div
        id={inputId}
        role="combobox"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        className={styles.trigger}
        onClick={() => !disabled && toggle()}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && !disabled && toggle()}
      >
        <div className={styles.selection}>{renderSelection()}</div>
        {cleaner && sel.length > 0 && (
          <button
            type="button"
            className={styles.cleaner}
            onClick={e => { e.stopPropagation(); deselectAllFn(); }}
            aria-label="Limpiar selección"
            tabIndex={-1}
          >✕</button>
        )}
        <span className={styles.indicator} aria-hidden="true">▾</span>
      </div>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            role="listbox"
            aria-multiselectable={multiple}
            className={styles.panel}
            style={{ maxHeight: optionsMaxHeight !== 'auto' ? optionsMaxHeight : undefined }}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
          >
            {search && (
              <div className={styles.searchWrapper}>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Buscar..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  aria-label="Buscar opciones"
                />
              </div>
            )}

            {selectAll && multiple && (
              <div
                role="option"
                aria-selected={allSelected}
                className={`${styles.option} ${allSelected ? styles.optionSelected : ''}`}
                onClick={() => allSelected ? deselectAllFn() : selectAllFn()}
              >
                {optionsStyle === 'checkbox' && (
                  <input type="checkbox" checked={allSelected} readOnly tabIndex={-1}
                    className={styles.optionCheckbox} />
                )}
                <span>{selectAllLabel}</span>
              </div>
            )}

            {filtered.length === 0 && query && (
              <div className={styles.noResults}>{searchNoResultsLabel}</div>
            )}

            {filtered.map((opt, i) => {
              const selected_opt = isSelected(opt);
              return (
                <div
                  key={getValue(opt) ?? i}
                  role="option"
                  aria-selected={selected_opt}
                  className={`${styles.option} ${selected_opt ? styles.optionSelected : ''}`}
                  onClick={() => toggle_opt(opt)}
                >
                  {optionsStyle === 'checkbox' && (
                    <input type="checkbox" checked={selected_opt} readOnly tabIndex={-1}
                      className={styles.optionCheckbox} />
                  )}
                  <span>{getLabel(opt)}</span>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input oculto para formularios */}
      {name && sel.map((v, i) => (
        <input key={`hidden-${v}`} type="hidden" name={name} value={v} />
      ))}
    </div>
  );
});

export default MultiSelect;
export { MultiSelect };
