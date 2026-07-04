// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/DatePicker/DateRangePicker.jsx
/**
 * DateRangePicker — ecommerce-ui
 * Selector de rango de fechas con dos calendarios y TimePicker opcional.
 *
 * Lógica completa de ui-core-5.25.0 date-range-picker.js:
 *   - toggle/show/hide/cancel/clear/reset/update
 *   - calendars: 2 por defecto (dos meses)
 *   - separator: '–' en el input de display
 *   - startDate / endDate independientes o como rango
 *   - cancelButton / confirmButton configurables
 *   - Selección en dos clics: primero start, luego end
 *   - Hover state: previsualiza el rango antes de confirmar
 *   - Con o sin TimePicker integrado
 *
 * Referencia: ui-core-5.25.0 date-range-picker.js
 * Iniciativa: implementar-componentes-diferidos-ui-core
 */
import {
  useState, useRef, useCallback, useEffect,
  useImperativeHandle, forwardRef, useId,
} from 'react';
import Calendar from './Calendar';
import TimePicker from '../TimePicker/TimePicker';
import useClickOutside from '@hooks/ui/useClickOutside';
import useEscapeKey    from '@hooks/ui/useEscapeKey';
import Icon from '@components/common/Icon/Icon';
import styles from './DateRangePicker.module.scss';

function fmt(date, locale) {
  if (!date) return '';
  return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const DateRangePicker = forwardRef(function DateRangePicker({
  startDate:    controlledStart,
  endDate:      controlledEnd,
  onStartDateChange,
  onEndDateChange,
  onRangeChange,    // ({ startDate, endDate }) callback conveniente
  placeholder   = ['Fecha inicio', 'Fecha fin'],
  locale        = 'es-MX',
  separator     = '–',             // Default ui-core
  calendars     = 2,               // Default ui-core
  cancelButton  = 'Cancelar',      // Default ui-core
  confirmButton = 'OK',            // Default ui-core
  firstDayOfWeek = 1,
  minDate,
  maxDate,
  disabledDates,
  disabled      = false,
  required      = false,
  cleaner       = true,
  timepicker    = false,           // TimePicker integrado opcional
  size,
  className     = '',
  // Eventos
  onShow, onShown, onHide, onHidden, onHidePrevented,
}, ref) {
  const [open, setOpen]         = useState(false);
  const [selStart, setSelStart] = useState(controlledStart ? new Date(controlledStart) : null);
  const [selEnd,   setSelEnd]   = useState(controlledEnd   ? new Date(controlledEnd)   : null);
  const [draft, setDraft]       = useState({ start: null, end: null });
  const [pickingEnd, setPickingEnd] = useState(false);
  const panelRef = useRef(null);
  const id = useId();

  const show = useCallback(() => {
    if (disabled) return;
    setDraft({ start: selStart, end: selEnd });
    setPickingEnd(false);
    setOpen(true);
    onShow?.();
    setTimeout(() => onShown?.(), 200);
  }, [disabled, selStart, selEnd, onShow, onShown]);

  const hide = useCallback(() => {
    setOpen(false);
    onHide?.();
    setTimeout(() => onHidden?.(), 200);
  }, [onHide, onHidden]);

  const toggle = useCallback(() => open ? hide() : show(), [open, hide, show]);

  const cancel = useCallback(() => {
    setDraft({ start: selStart, end: selEnd });
    hide();
  }, [selStart, selEnd, hide]);

  const clear = useCallback(() => {
    setSelStart(null); setSelEnd(null);
    setDraft({ start: null, end: null });
    onStartDateChange?.(null);
    onEndDateChange?.(null);
    onRangeChange?.({ startDate: null, endDate: null });
    hide();
  }, [onStartDateChange, onEndDateChange, onRangeChange, hide]);

  const reset = clear;

  const update = useCallback((config) => {
    if (config.startDate) setSelStart(new Date(config.startDate));
    if (config.endDate)   setSelEnd(new Date(config.endDate));
  }, []);

  useImperativeHandle(ref, () => ({
    toggle, show, hide, cancel, clear, reset, update,
    getValue: () => ({ startDate: selStart, endDate: selEnd }),
  }), [toggle, show, hide, cancel, clear, reset, update, selStart, selEnd]);

  useEscapeKey(hide, open);
  useClickOutside(panelRef, () => { if (open) hide(); }, open);

  // Confirmar la selección
  const confirm = useCallback(() => {
    if (draft.start) {
      setSelStart(draft.start);
      onStartDateChange?.(draft.start);
    }
    if (draft.end) {
      setSelEnd(draft.end);
      onEndDateChange?.(draft.end);
    }
    onRangeChange?.({ startDate: draft.start, endDate: draft.end });
    hide();
  }, [draft, onStartDateChange, onEndDateChange, onRangeChange, hide]);

  // Click en una fecha del Calendar
  const handleStartDate = useCallback((date) => {
    setDraft(prev => {
      if (!pickingEnd) {
        setPickingEnd(true);
        return { start: date, end: null };
      } else {
        const [s, e] = date < prev.start ? [date, prev.start] : [prev.start, date];
        setPickingEnd(false);
        return { start: s, end: e };
      }
    });
  }, [pickingEnd]);

  // Texto del input combinado
  const inputValue = selStart || selEnd
    ? [fmt(selStart, locale), fmt(selEnd, locale)].filter(Boolean).join(` ${separator} `)
    : '';

  return (
    <div
      ref={panelRef}
      className={[
        styles.drp,
        disabled ? styles.disabled : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {/* Input compuesto — equivale al input group de ui-core DateRangePicker */}
      <div className={styles.inputGroup} onClick={() => !disabled && show()}>
        <input
          id={`${id}-start`}
          type="text"
          placeholder={placeholder[0]}
          value={selStart ? fmt(selStart, locale) : ''}
          onChange={() => {}}
          className={styles.input}
          disabled={disabled}
          required={required}
          readOnly
          aria-haspopup="dialog"
          aria-expanded={open}
        />
        {(selStart || selEnd) && <span className={styles.sep}>{separator}</span>}
        <input
          id={`${id}-end`}
          type="text"
          placeholder={placeholder[1]}
          value={selEnd ? fmt(selEnd, locale) : ''}
          onChange={() => {}}
          className={styles.input}
          disabled={disabled}
          readOnly
        />
        {cleaner && (selStart || selEnd) && (
          <button type="button" className={styles.cleaner} onClick={e => { e.stopPropagation(); clear(); }} aria-label="Limpiar rango"><Icon name="x" size={14} /></button>
        )}
        <span className={styles.indicator} aria-hidden="true">📅</span>
      </div>

      {/* Panel */}
      {open && (
        <div className={styles.dropdown} role="dialog" aria-label="Seleccionar rango de fechas">
          <Calendar
            range
            calendars={calendars}
            firstDayOfWeek={firstDayOfWeek}
            startDate={draft.start}
            endDate={draft.end}
            minDate={minDate}
            maxDate={maxDate}
            disabledDates={disabledDates}
            locale={locale}
            onStartDateChange={(d) => setDraft(prev => ({ ...prev, start: d }))}
            onEndDateChange={(d)   => setDraft(prev => ({ ...prev, end: d }))}
            onDateChange={handleStartDate}
          />

          {timepicker && (
            <div className={styles.timePickers}>
              <TimePicker
                placeholder="Hora inicio"
                seconds={false}
                footer={false}
              />
              <TimePicker
                placeholder="Hora fin"
                seconds={false}
                footer={false}
              />
            </div>
          )}

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={cancel}>{cancelButton}</button>
            <button type="button" className={styles.confirmBtn} onClick={confirm}
              disabled={!draft.start}
            >{confirmButton}</button>
          </div>
        </div>
      )}
    </div>
  );
});

export default DateRangePicker;
export { DateRangePicker };
