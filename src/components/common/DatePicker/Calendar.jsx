// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/DatePicker/Calendar.jsx
/**
 * Calendar — ecommerce-ui
 * Cuadrícula de navegación temporal: días, meses, años.
 *
 * Lógica completa de ui-core-5.25.0 calendar.js:
 *   selectionType: 'day' | 'week' | 'month' | 'quarter' | 'year'
 *   range:         boolean — selección de rango start/end
 *   calendars:     número de paneles lado a lado
 *   firstDayOfWeek: 1 = lunes (default ui-core)
 *   locale:        Intl locale para nombres
 *   minDate / maxDate / disabledDates
 *   dayFormat / monthFormat / yearFormat / weekdayFormat
 *   showWeekNumber / showAdjacementDays / selectAdjacementDays
 *   renderDayCell / renderMonthCell / renderYearCell  (slot personalizable)
 *   Vistas: days → months → years (click en el header)
 *   Navegación prev/next mes y año con doble flecha
 *   Eventos: onDateChange(date), onStartDateChange, onEndDateChange
 *   update(config) / refresh() via ref
 *
 * Referencia: ui-core-5.25.0 calendar.js + util/calendar.js
 * Iniciativa: implementar-componentes-diferidos-ui-core
 */
import {
  useState, useCallback, useRef,
  useImperativeHandle, forwardRef, useMemo, useId,
} from 'react';
import { isSameDay } from '@lib/dateMath';
import styles from './Calendar.module.scss';

// ─── Helpers de calendario (equivalen a util/calendar.js) ────────────────────

function isToday(date) {
  const t = new Date();
  return date.getFullYear() === t.getFullYear()
    && date.getMonth() === t.getMonth()
    && date.getDate() === t.getDate();
}

// isSameDay vive ahora en lib/dateMath (patrón kno-date-math isEqualDate).

function isBetween(date, start, end) {
  if (!start || !end) return false;
  const d = date.getTime();
  return d > start.getTime() && d < end.getTime();
}

function isDisabled(date, minDate, maxDate, disabledDates) {
  if (minDate && date < minDate) return true;
  if (maxDate && date > maxDate) return true;
  if (Array.isArray(disabledDates)) {
    return disabledDates.some(d => isSameDay(date, new Date(d)));
  }
  if (typeof disabledDates === 'function') return disabledDates(date);
  return false;
}

function isSameMonth(a, b)   { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth(); }
function isSameYear(a, b)    { return a.getFullYear() === b.getFullYear(); }
function isSameQuarter(a, b) {
  return a.getFullYear() === b.getFullYear()
    && Math.floor(a.getMonth() / 3) === Math.floor(b.getMonth() / 3);
}

// Equivale a getMonthDetails de util/calendar.js
function getMonthGrid(year, month, firstDayOfWeek = 1) {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);

  // Días previos
  let startDow = first.getDay();
  if (firstDayOfWeek === 1) startDow = (startDow + 6) % 7; // lunes primero
  const prev = [];
  for (let i = startDow - 1; i >= 0; i--) {
    prev.push({ date: new Date(year, month, -i), month: 'previous' });
  }

  // Días del mes
  const curr = [];
  for (let d = 1; d <= last.getDate(); d++) {
    curr.push({ date: new Date(year, month, d), month: 'current' });
  }

  // Días siguientes para completar semanas
  const total  = prev.length + curr.length;
  const trail  = total % 7 === 0 ? 0 : 7 - (total % 7);
  const next   = [];
  for (let d = 1; d <= trail; d++) {
    next.push({ date: new Date(year, month + 1, d), month: 'next' });
  }

  const all = [...prev, ...curr, ...next];
  const weeks = [];
  for (let i = 0; i < all.length; i += 7) {
    weeks.push(all.slice(i, i + 7));
  }
  return weeks;
}

function getMonthsGrid(locale, format) {
  const rows = [];
  for (let r = 0; r < 3; r++) {
    const row = [];
    for (let c = 0; c < 4; c++) {
      const m = r * 4 + c;
      row.push({ month: m, label: new Date(2000, m, 1).toLocaleString(locale, { month: format }) });
    }
    rows.push(row);
  }
  return rows;
}

function getYearsGrid(centerYear) {
  const base = centerYear - 6;
  const rows = [];
  for (let r = 0; r < 3; r++) {
    const row = [];
    for (let c = 0; c < 4; c++) {
      row.push(base + r * 4 + c);
    }
    rows.push(row);
  }
  return rows;
}

// ─── Componente principal ─────────────────────────────────────────────────────

const Calendar = forwardRef(function Calendar({
  // Selection
  selectionType  = 'day',
  range          = false,
  startDate      = null,
  endDate        = null,
  calendarDate   = null,
  onDateChange,          // para selección simple
  onStartDateChange,     // para rango
  onEndDateChange,
  onCalendarDateChange,
  // Display
  calendars       = 1,   // Default ui-core
  firstDayOfWeek  = 1,   // 1 = lunes (Default ui-core)
  locale          = 'default',
  dayFormat       = 'numeric',
  monthFormat     = 'short',
  yearFormat      = 'numeric',
  weekdayFormat   = 2,   // número de letras o 'short'/'long'
  showWeekNumber  = false,
  showAdjacementDays = true,
  selectAdjacementDays = false,
  // Constraints
  minDate        = null,
  maxDate        = null,
  disabledDates  = null,
  // Slots
  renderDayCell,
  renderMonthCell,
  renderYearCell,
  className      = '',
}, ref) {
  const viewMap = { day: 'days', week: 'days', month: 'months', quarter: 'quarters', year: 'years' };
  const initView = viewMap[selectionType] || 'days';

  const [view, setView]         = useState(initView);
  const [navDate, setNavDate]   = useState(() => calendarDate ? new Date(calendarDate) : new Date());
  const [hoverDate, setHoverDate] = useState(null);

  // Selección interna para ranges en curso
  const [selStart, setSelStart] = useState(startDate ? new Date(startDate) : null);
  const [selEnd,   setSelEnd]   = useState(endDate   ? new Date(endDate)   : null);
  const [selectingEnd, setSelectingEnd] = useState(false);
  const id = useId();

  // update() / refresh() via ref — equivale a los métodos públicos de ui-core
  useImperativeHandle(ref, () => ({
    refresh: () => setNavDate(d => new Date(d)),
    update:  (config) => {
      if (config.calendarDate) setNavDate(new Date(config.calendarDate));
      if (config.startDate)    setSelStart(new Date(config.startDate));
      if (config.endDate)      setSelEnd(new Date(config.endDate));
    },
  }));

  // ─── Navegación ──────────────────────────────────────────────────────────────
  const prevMonth = () => setNavDate(d => { const n = new Date(d); n.setDate(1); n.setMonth(n.getMonth() - 1); return n; });
  const nextMonth = () => setNavDate(d => { const n = new Date(d); n.setDate(1); n.setMonth(n.getMonth() + 1); return n; });
  const prevYear  = () => setNavDate(d => { const n = new Date(d); n.setDate(1); n.setFullYear(n.getFullYear() - 1); return n; });
  const nextYear  = () => setNavDate(d => { const n = new Date(d); n.setDate(1); n.setFullYear(n.getFullYear() + 1); return n; });

  const goToMonthView = () => setView('months');
  const goToYearView  = () => setView('years');

  // ─── Selección ───────────────────────────────────────────────────────────────
  const handleDayClick = useCallback((date, month) => {
    if (!selectAdjacementDays && month !== 'current') return;
    if (isDisabled(date, minDate ? new Date(minDate) : null, maxDate ? new Date(maxDate) : null, disabledDates)) return;

    if (selectionType === 'day' && !range) {
      onDateChange?.(date);
      return;
    }

    if (range) {
      if (!selectingEnd || !selStart) {
        setSelStart(date);
        setSelEnd(null);
        setSelectingEnd(true);
        onStartDateChange?.(date);
      } else {
        const [s, e] = date < selStart ? [date, selStart] : [selStart, date];
        setSelStart(s); setSelEnd(e);
        setSelectingEnd(false);
        onStartDateChange?.(s);
        onEndDateChange?.(e);
      }
    }
  }, [range, selectionType, selectingEnd, selStart, minDate, maxDate, disabledDates,
      selectAdjacementDays, onDateChange, onStartDateChange, onEndDateChange]);

  const handleMonthClick = useCallback((month) => {
    const d = new Date(navDate.getFullYear(), month, 1);
    if (selectionType === 'month') {
      onDateChange?.(d);
    } else {
      setNavDate(d);
      setView('days');
    }
  }, [navDate, selectionType, onDateChange]);

  const handleYearClick = useCallback((year) => {
    const d = new Date(year, navDate.getMonth(), 1);
    if (selectionType === 'year') {
      onDateChange?.(d);
    } else {
      setNavDate(d);
      setView('months');
    }
  }, [navDate, selectionType, onDateChange]);

  // ─── Nombre del día de semana ─────────────────────────────────────────────────
  const fmtWeekday = useCallback((date) => {
    if (typeof weekdayFormat === 'number') {
      return date.toLocaleDateString(locale, { weekday: 'long' }).slice(0, weekdayFormat);
    }
    return date.toLocaleDateString(locale, { weekday: weekdayFormat });
  }, [locale, weekdayFormat]);

  // ─── Clases de celdas de días ────────────────────────────────────────────────
  const dayClasses = useCallback((date, month) => {
    const s = selStart || (startDate ? new Date(startDate) : null);
    const e = selEnd   || (endDate   ? new Date(endDate)   : null);
    const hover = hoverDate;

    return [
      styles.cell,
      month !== 'current' ? styles.adjacent : '',
      isToday(date)    ? styles.today    : '',
      isSameDay(date, s) ? styles.rangeStart : '',
      isSameDay(date, e) ? styles.rangeEnd   : '',
      (isBetween(date, s, e) || (hover && isBetween(date, s, hover))) ? styles.inRange : '',
      isDisabled(date, minDate ? new Date(minDate) : null, maxDate ? new Date(maxDate) : null, disabledDates)
        ? styles.disabled : '',
    ].filter(Boolean).join(' ');
  }, [selStart, selEnd, startDate, endDate, hoverDate, minDate, maxDate, disabledDates]);

  // ─── Render de un panel ──────────────────────────────────────────────────────
  const renderPanel = (offset) => {
    const pd = new Date(navDate.getFullYear(), navDate.getMonth() + offset, 1);
    const year = pd.getFullYear();
    const month = pd.getMonth();
    const weeks = getMonthGrid(year, month, firstDayOfWeek);
    const weekdays = weeks[0].map(({ date }) => date);

    return (
      <div key={offset} className={styles.panel}>
        {/* Navegación — equivale a calendar-nav en ui-core */}
        <div className={styles.nav}>
          <div className={styles.navPrev}>
            <button type="button" className={styles.navBtn}
              onClick={prevYear}
              aria-label="Año anterior">‹‹</button>
            {view === 'days' &&
              <button type="button" className={styles.navBtn}
                onClick={prevMonth}
                aria-label="Mes anterior">‹</button>}
          </div>

          <div className={styles.navTitle} aria-live="polite">
            {view === 'days' && (
              <button type="button" className={styles.navTitleBtn}
                onClick={goToMonthView}>
                {pd.toLocaleDateString(locale, { month: 'long' })}
              </button>
            )}
            <button type="button" className={styles.navTitleBtn}
              onClick={goToYearView}>
              {pd.toLocaleDateString(locale, { year: 'numeric' })}
            </button>
          </div>

          <div className={styles.navNext}>
            {view === 'days' &&
              <button type="button" className={styles.navBtn}
                onClick={nextMonth}
                aria-label="Mes siguiente">›</button>}
            <button type="button" className={styles.navBtn}
              onClick={nextYear}
              aria-label="Año siguiente">››</button>
          </div>
        </div>

        {/* Grid de días */}
        {view === 'days' && (
          <table className={styles.table} role="grid">
            <thead>
              <tr>
                {weekdays.map((d, i) => (
                  <th key={d.toISOString()} scope="col" abbr={d.toLocaleDateString(locale, { weekday: 'long' })}>
                    {fmtWeekday(d)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, wi) => (
                <tr key={wi}>
                  {week.map(({ date, month: m }, di) => {
                    const cls = dayClasses(date, m);
                    const hidden = m !== 'current' && !showAdjacementDays;
                    const dis = isDisabled(
                      date,
                      minDate ? new Date(minDate) : null,
                      maxDate ? new Date(maxDate) : null,
                      disabledDates
                    );
                    return (
                      <td key={di}
                        className={cls}
                        tabIndex={m === 'current' && !dis ? 0 : -1}
                        aria-selected={
                          (isSameDay(date, selStart) || isSameDay(date, selEnd)) ? true : undefined
                        }
                        aria-disabled={dis ? true : undefined}
                        onClick={() => !hidden && handleDayClick(date, m)}
                        onMouseEnter={() => range && selectingEnd && setHoverDate(date)}
                        onMouseLeave={() => range && setHoverDate(null)}
                        data-date={date.toISOString().slice(0, 10)}
                      >
                        {!hidden && (
                          <div className={styles.cellInner}>
                            {renderDayCell
                              ? renderDayCell(date, { isToday: isToday(date), isDisabled: dis })
                              : date.toLocaleDateString(locale, { day: dayFormat })}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Grid de meses */}
        {view === 'months' && (
          <table className={styles.table} role="grid">
            <tbody>
              {getMonthsGrid(locale, monthFormat).map((row, ri) => (
                <tr key={ri}>
                  {row.map(({ month: m, label }) => {
                    const d = new Date(year, m, 1);
                    const sel = selStart && isSameMonth(d, selStart) || (startDate && isSameMonth(d, new Date(startDate)));
                    return (
                      <td key={m}
                        className={`${styles.cell} ${sel ? styles.rangeStart : ''}`}
                        tabIndex={0}
                        aria-selected={sel ? true : undefined}
                        onClick={() => handleMonthClick(m)}
                      >
                        <div className={styles.cellInner}>
                          {renderMonthCell ? renderMonthCell(d) : label}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Grid de años */}
        {view === 'years' && (
          <table className={styles.table} role="grid">
            <tbody>
              {getYearsGrid(year).map((row, ri) => (
                <tr key={ri}>
                  {row.map(yr => {
                    const d = new Date(yr, 0, 1);
                    const sel = selStart && isSameYear(d, selStart);
                    return (
                      <td key={yr}
                        className={`${styles.cell} ${sel ? styles.rangeStart : ''}`}
                        tabIndex={0}
                        aria-selected={sel ? true : undefined}
                        onClick={() => handleYearClick(yr)}
                      >
                        <div className={styles.cellInner}>
                          {renderYearCell ? renderYearCell(d) : yr}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  return (
    <div
      id={id}
      className={`${styles.calendars} ${className}`}
      data-calendars={calendars}
    >
      {Array.from({ length: calendars }, (_, i) => renderPanel(i))}
    </div>
  );
});

export default Calendar;
export { isToday, isSameDay, isDisabled };
export { Calendar };
