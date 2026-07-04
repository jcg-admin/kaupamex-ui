// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/TimePicker/TimePicker.jsx
/**
 * TimePicker — ecommerce-ui
 * Selector de hora con rueda (variant='roll') o selects (variant='select').
 *
 * Lógica completa de ui-core-5.25.0 time-picker.js:
 *   toggle/show/hide/cancel/clear/reset/update
 *   variant: 'roll' | 'select'
 *   hours/minutes/seconds: configuración de columnas visibles
 *   cleaner: botón de limpiar el valor
 *   indicator: icono de reloj que abre el panel
 *   footer: botones Cancelar + OK
 *   inputReadOnly: input solo lectura
 *   inputOnChangeDelay: debounce del input (750ms default)
 *   locale: para formatos 24h / AM-PM
 *   placeholder / disabled / required / invalid / valid
 *
 * Referencia: ui-core-5.25.0 time-picker.js
 * Iniciativa: implementar-componentes-diferidos-ui-core
 */
import {
  useState, useRef, useCallback, useEffect, useId,
  useImperativeHandle, forwardRef,
} from 'react';
import useClickOutside from '@hooks/ui/useClickOutside';
import useEscapeKey    from '@hooks/ui/useEscapeKey';
import Icon from '@components/common/Icon/Icon';
import styles from './TimePicker.module.scss';

// Generar las opciones de la rueda (0–23, 0–59)
function range(n) {
  return Array.from({ length: n }, (_, i) => String(i).padStart(2, '0'));
}

const TimePicker = forwardRef(function TimePicker({
  value:      controlled,     // 'HH:MM' | 'HH:MM:SS'
  onChange,
  placeholder = 'Seleccionar hora',
  disabled    = false,
  required    = false,
  invalid     = false,
  valid       = false,
  cleaner     = true,          // Default de ui-core
  indicator   = true,          // Default de ui-core — icono de reloj
  footer      = true,          // Default de ui-core — botones Cancel/OK
  cancelButton = 'Cancelar',
  confirmButton = 'OK',
  variant     = 'roll',        // Default de ui-core — 'roll' | 'select'
  hours       = null,          // null = 0–23
  minutes     = true,          // Default de ui-core
  seconds     = true,          // Default de ui-core
  inputReadOnly = false,
  inputOnChangeDelay = 750,    // Default de ui-core
  locale      = 'default',
  name,
  className   = '',
  onShow,
  onHide,
  onHidden,
  onClear,
  onCancel,
  onConfirm,
  onTimeChange,
}, ref) {
  const [open, setOpen]         = useState(false);
  const [internal, setInternal] = useState('');
  const [draft, setDraft]       = useState('');   // Valor en curso durante edición
  const inputRef  = useRef(null);
  const panelRef  = useRef(null);
  const inputTimerRef = useRef(null);
  const id = useId();

  const time = controlled !== undefined ? controlled : internal;

  // Parsear HH:MM:SS
  const parseTime = (str) => {
    if (!str) return { h: '00', m: '00', s: '00' };
    const parts = str.split(':');
    return {
      h: parts[0]?.padStart(2, '0') ?? '00',
      m: parts[1]?.padStart(2, '0') ?? '00',
      s: parts[2]?.padStart(2, '0') ?? '00',
    };
  };

  const { h, m, s } = parseTime(time || draft);

  const setTime = useCallback((val) => {
    if (controlled === undefined) setInternal(val);
    onChange?.(val);
    onTimeChange?.(val);
  }, [controlled, onChange, onTimeChange]);

  // ─── show/hide/toggle — equivale a los métodos públicos de ui-core ──────────
  const show = useCallback(() => {
    if (disabled) return;
    setDraft(time);
    setOpen(true);
    onShow?.();
  }, [disabled, time, onShow]);

  const hide = useCallback(() => {
    setOpen(false);
    onHide?.();
    setTimeout(() => onHidden?.(), 200);
  }, [onHide, onHidden]);

  const toggle = useCallback(() => open ? hide() : show(), [open, hide, show]);

  // cancel() — equivale al método cancel() de ui-core
  const cancel = useCallback(() => {
    setDraft('');
    hide();
    onCancel?.();
  }, [hide, onCancel]);

  // clear() — equivale al método clear() de ui-core
  const clear = useCallback(() => {
    setTime('');
    if (inputRef.current) inputRef.current.value = '';
    onClear?.();
  }, [setTime, onClear]);

  // reset() — equivale al método reset() de ui-core
  const reset = useCallback(() => { setTime(''); setDraft(''); }, [setTime]);

  // Confirmar — equivale al click en el botón OK
  const confirm = useCallback(() => {
    if (draft) setTime(draft);
    hide();
    onConfirm?.(draft || time);
  }, [draft, time, setTime, hide, onConfirm]);

  // update(config) — equivale a update() de ui-core
  const update = useCallback((config) => {
    if (config.value !== undefined) setTime(config.value);
  }, [setTime]);

  useImperativeHandle(ref, () => ({
    toggle, show, hide, cancel, clear, reset, update,
    getValue: () => time,
  }), [toggle, show, hide, cancel, clear, reset, update, time]);

  // Escape cierra
  useEscapeKey(hide, open);
  useClickOutside(panelRef, () => { if (open) hide(); }, open);

  // Input con debounce — equivale a inputOnChangeDelay de ui-core
  const handleInput = useCallback((e) => {
    const val = e.target.value;
    clearTimeout(inputTimerRef.current);
    inputTimerRef.current = setTimeout(() => {
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(val)) {
        setTime(val);
        onTimeChange?.(val);
      }
    }, inputOnChangeDelay);
  }, [setTime, onTimeChange, inputOnChangeDelay]);

  // Columna de rueda para roll variant
  const RollColumn = ({ label, options, value: colVal, onSelect }) => (
    <div className={styles.rollCol} aria-label={label}>
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          className={`${styles.rollCell} ${opt === colVal ? styles.rollCellActive : ''}`}
          onClick={() => onSelect(opt)}
          tabIndex={0}
          aria-selected={opt === colVal}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  // Select variant — usa <select> nativos
  const SelectColumn = ({ label, options, value: colVal, onSelect }) => (
    <select
      className={styles.selectCol}
      value={colVal}
      onChange={e => onSelect(e.target.value)}
      aria-label={label}
    >
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );

  const hourOptions  = Array.isArray(hours) ? hours.map(n => String(n).padStart(2,'0')) : range(24);
  const minuteOpts   = range(60);
  const secondOpts   = range(60);

  const updateH = (v) => setDraft(`${v}:${m}:${s}`);
  const updateM = (v) => setDraft(`${h}:${v}:${s}`);
  const updateS = (v) => setDraft(`${h}:${m}:${v}`);

  const ColCmp = variant === 'roll' ? RollColumn : SelectColumn;

  return (
    <div
      className={[
        styles.timePicker,
        disabled ? styles.disabled : '',
        invalid  ? styles.invalid  : '',
        valid    ? styles.valid    : '',
        className,
      ].filter(Boolean).join(' ')}
      ref={panelRef}
    >
      {/* Input group — equivale a _createTimePickerInputGroup */}
      <div className={styles.inputGroup}>
        <input
          ref={inputRef}
          type="text"
          id={id}
          name={name}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          readOnly={inputReadOnly}
          defaultValue={time}
          className={styles.input}
          onChange={handleInput}
          onClick={() => !disabled && show()}
          aria-haspopup="dialog"
          aria-expanded={open}
          autoComplete="off"
        />
        {indicator && (
          <span
            className={styles.indicator}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label="Abrir selector de hora"
            onClick={toggle}
            onKeyDown={e => e.key === 'Enter' && toggle()}
          >
            🕐
          </span>
        )}
        {cleaner && time && (
          <button
            type="button"
            className={styles.cleaner}
            onClick={clear}
            aria-label="Limpiar hora"
            tabIndex={-1}
          >
            <Icon name="x" size={14} />
          </button>
        )}
      </div>

      {/* Dropdown — equivale a _createTimePickerBody */}
      {open && (
        <div className={styles.dropdown} role="dialog" aria-label="Selector de hora">
          <div className={styles.body}>
            <ColCmp label="Horas"   options={hourOptions} value={h} onSelect={updateH} />
            {minutes && <ColCmp label="Minutos" options={minuteOpts} value={m} onSelect={updateM} />}
            {seconds && <ColCmp label="Segundos" options={secondOpts} value={s} onSelect={updateS} />}
          </div>

          {/* Footer — equivale a _createTimePickerFooter */}
          {footer && (
            <div className={styles.footer}>
              <button type="button" className={styles.cancelBtn} onClick={cancel}>
                {cancelButton}
              </button>
              <button type="button" className={styles.confirmBtn} onClick={confirm}>
                {confirmButton}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default TimePicker;
export { TimePicker };
