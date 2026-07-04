// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/DatePicker/DatePicker.jsx
/**
 * DatePicker — ecommerce-ui
 * Selector de fecha individual con input de texto y panel Calendar.
 *
 * Lógica completa de ui-core-5.25.0 date-picker.js:
 *   - Extiende DateRangePicker con calendars:1, range:false
 *   - toggle/show/hide/cancel/clear/reset/update
 *   - placeholder configurable
 *   - Input de texto con parseo de fecha local
 *   - cleaner: botón para limpiar la selección
 *   - disabled / required / invalid / valid
 *   - Con o sin TimePicker integrado (timepicker prop)
 *
 * Referencia: ui-core-5.25.0 date-picker.js → date-range-picker.js
 * Iniciativa: implementar-componentes-diferidos-ui-core
 */
import {
  useState, useRef, useCallback, useEffect,
  useImperativeHandle, forwardRef, useId,
} from 'react';
import Calendar from './Calendar';
import useClickOutside from '@hooks/ui/useClickOutside';
import useEscapeKey    from '@hooks/ui/useEscapeKey';
import Icon from '@components/common/Icon/Icon';
import styles from './DatePicker.module.scss';

function formatDate(date, locale, format = {}) {
  if (!date) return '';
  return date.toLocaleDateString(locale, {
    day: '2-digit', month: '2-digit', year: 'numeric', ...format,
  });
}

function parseLocalDate(str) {
  if (!str) return null;
  // Intentar ISO primero
  const iso = new Date(str);
  if (!isNaN(iso.getTime())) return iso;
  // Intentar DD/MM/YYYY
  const parts = str.split(/[-/.]/).map(Number);
  if (parts.length === 3) {
    const [a, b, c] = parts;
    if (c > 1000) return new Date(c, b - 1, a); // DD/MM/YYYY
    return new Date(a, b - 1, c);               // YYYY/MM/DD
  }
  return null;
}

const DatePicker = forwardRef(function DatePicker({
  value:       controlled,
  onChange,
  placeholder  = 'Seleccionar fecha',
  locale       = 'es-MX',
  // Hereda todas las props de Calendar
  firstDayOfWeek = 1,
  minDate,
  maxDate,
  disabledDates,
  selectionType = 'day',
  // UI
  disabled     = false,
  required     = false,
  invalid      = false,
  valid        = false,
  cleaner      = true,
  size,
  name,
  className    = '',
  // Eventos equivalentes a ui-core
  onShow,
  onShown,
  onHide,
  onHidden,
  onDateChange,
  // TimePicker integrado (opcional)
  timepicker   = false,
}, ref) {
  const [open, setOpen]       = useState(false);
  const [internal, setInternal] = useState(null);
  const [draft, setDraft]     = useState(null);
  const panelRef  = useRef(null);
  const inputRef  = useRef(null);
  const id = useId();

  const date = controlled !== undefined ? (controlled ? new Date(controlled) : null) : internal;

  const setDate = useCallback((val) => {
    if (controlled === undefined) setInternal(val);
    onChange?.(val);
    onDateChange?.(val);
  }, [controlled, onChange, onDateChange]);

  // show() — equivale a show() de ui-core DateRangePicker
  const show = useCallback(() => {
    if (disabled) return;
    setDraft(date);
    setOpen(true);
    onShow?.();
    setTimeout(() => onShown?.(), 200);
  }, [disabled, date, onShow, onShown]);

  const hide = useCallback(() => {
    setOpen(false);
    onHide?.();
    setTimeout(() => onHidden?.(), 200);
  }, [onHide, onHidden]);

  const toggle = useCallback(() => open ? hide() : show(), [open, hide, show]);

  // cancel() — restaura el valor anterior
  const cancel = useCallback(() => {
    setDraft(date);
    hide();
  }, [date, hide]);

  // clear() — limpia la selección
  const clear = useCallback(() => {
    setDate(null);
    setDraft(null);
    if (inputRef.current) inputRef.current.value = '';
    hide();
  }, [setDate, hide]);

  // reset() — equivale a reset() de ui-core
  const reset = useCallback(() => { setDate(null); setDraft(null); }, [setDate]);

  // update(config) — equivale a update() de ui-core
  const update = useCallback((config) => {
    if (config.value !== undefined) setDate(config.value ? new Date(config.value) : null);
  }, [setDate]);

  useImperativeHandle(ref, () => ({
    toggle, show, hide, cancel, clear, reset, update,
    getValue: () => date,
  }), [toggle, show, hide, cancel, clear, reset, update, date]);

  useEscapeKey(hide, open);
  useClickOutside(panelRef, () => { if (open) hide(); }, open);

  // Actualizar input cuando cambia la fecha
  useEffect(() => {
    if (inputRef.current && date) {
      inputRef.current.value = formatDate(date, locale);
    }
  }, [date, locale]);

  // Manejar escritura manual en el input
  const handleInputChange = useCallback((e) => {
    const parsed = parseLocalDate(e.target.value);
    if (parsed) setDraft(parsed);
  }, []);

  const handleCalendarDate = useCallback((d) => {
    setDraft(d);
    setDate(d);
    if (inputRef.current) inputRef.current.value = formatDate(d, locale);
    if (!timepicker) hide();
  }, [setDate, locale, hide, timepicker]);

  return (
    <div
      ref={panelRef}
      className={[
        styles.datePicker,
        disabled ? styles.disabled  : '',
        invalid  ? styles.invalid   : '',
        valid    ? styles.valid     : '',
        size     ? styles[`size_${size}`] : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {/* Input + cleaner + indicator */}
      <div className={styles.inputGroup}>
        <input
          ref={inputRef}
          id={id}
          type="text"
          name={name}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          defaultValue={date ? formatDate(date, locale) : ''}
          className={styles.input}
          onChange={handleInputChange}
          onClick={() => !disabled && show()}
          aria-haspopup="dialog"
          aria-expanded={open}
          autoComplete="off"
          readOnly
        />
        {cleaner && date && (
          <button type="button" className={styles.cleaner} onClick={clear} aria-label="Limpiar fecha"><Icon name="x" size={14} /></button>
        )}
        <span
          className={styles.indicator}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={toggle}
          onKeyDown={e => e.key === 'Enter' && toggle()}
          aria-label="Abrir calendario"
        >
          📅
        </span>
      </div>

      {/* Panel de calendario */}
      {open && (
        <div className={styles.dropdown} role="dialog" aria-label="Seleccionar fecha">
          <Calendar
            selectionType={selectionType}
            startDate={draft}
            firstDayOfWeek={firstDayOfWeek}
            minDate={minDate}
            maxDate={maxDate}
            disabledDates={disabledDates}
            locale={locale}
            onDateChange={handleCalendarDate}
            calendarDate={draft || date}
          />
          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={cancel}>Cancelar</button>
            <button type="button" className={styles.confirmBtn} onClick={() => { if (draft) setDate(draft); hide(); }}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
});

export default DatePicker;
export { DatePicker };
