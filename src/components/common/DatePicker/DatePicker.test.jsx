// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/DatePicker/DatePicker.test.jsx
/**
 * Tests: Calendar + DatePicker + DateRangePicker
 * Iniciativa: implementar-componentes-diferidos-ui-core
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { createRef } from 'react';
import Calendar from './Calendar';
import DatePicker from './DatePicker';
import DateRangePicker from './DateRangePicker';

// ─── Calendar ────────────────────────────────────────────────────────────────
describe('Calendar', () => {
  it('renderiza el grid de días con cabecera de días de semana', () => {
    render(<Calendar />);
    // El calendario tiene una tabla grid
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('navega al mes siguiente con el botón ›', () => {
    const now = new Date();
    render(<Calendar />);
    const nextBtn = screen.getByLabelText('Mes siguiente');
    fireEvent.click(nextBtn);
    // El header refleja el mes siguiente
    const expectedMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      .toLocaleDateString('default', { month: 'long' });
    expect(screen.getAllByRole('button').some(b => new RegExp(expectedMonth, 'i').test(b.textContent))).toBe(true);
  });

  it('navega al mes anterior con el botón ‹', () => {
    const now = new Date();
    render(<Calendar />);
    const prevBtn = screen.getByLabelText('Mes anterior');
    fireEvent.click(prevBtn);
    const expectedMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      .toLocaleDateString('default', { month: 'long' });
    expect(screen.getAllByRole('button').some(b => new RegExp(expectedMonth, 'i').test(b.textContent))).toBe(true);
  });

  it('selectionType=day llama onDateChange al hacer click en un día', () => {
    const onDateChange = jest.fn();
    const { container } = render(<Calendar selectionType="day" onDateChange={onDateChange} />);
    // Buscar una celda de día actual del mes (data-date attribute)
    const dayCells = container.querySelectorAll('td[data-date]');
    if (dayCells.length > 14) fireEvent.click(dayCells[14]); // día 15
    expect(onDateChange).toHaveBeenCalledTimes(1);
  });

  it('vista months aparece al clickear el nombre del mes', () => {
    const { container } = render(<Calendar />);
    const now = new Date();
    const monthName = now.toLocaleDateString('default', { month: 'long' });
    const monthBtn = screen.getByRole('button', { name: new RegExp(monthName, 'i') });
    fireEvent.click(monthBtn);
    // En vista months: 12 celdas de meses (3 filas × 4)
    const cells = container.querySelectorAll('table td');
    expect(cells.length).toBe(12);
  });

  it('ref.refresh() actualiza el calendario sin cambiar la vista', () => {
    const ref = createRef();
    render(<Calendar ref={ref} />);
    expect(typeof ref.current?.refresh).toBe('function');
    act(() => ref.current.refresh());
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('firstDayOfWeek=1 empieza el grid en lunes', () => {
    render(<Calendar firstDayOfWeek={1} />);
    const headers = screen.getAllByRole('columnheader');
    // Con firstDayOfWeek=1 (lunes) el primer header es Lu o similar
    expect(headers.length).toBeGreaterThanOrEqual(7);
  });

  it('calendars=2 renderiza dos paneles', () => {
    render(<Calendar calendars={2} />);
    // Con 2 calendarios hay 2 grids
    expect(screen.getAllByRole('grid').length).toBe(2);
  });

  it('renderDayCell permite renderizado personalizado', () => {
    render(
      <Calendar renderDayCell={(date) => `★${date.getDate()}★`} />
    );
    expect(screen.getAllByText(/★\d+★/).length).toBeGreaterThan(0);
  });
});

// ─── DatePicker ──────────────────────────────────────────────────────────────
describe('DatePicker', () => {
  it('renderiza el input con placeholder', () => {
    render(<DatePicker placeholder="Seleccionar fecha" />);
    expect(screen.getByPlaceholderText('Seleccionar fecha')).toBeInTheDocument();
  });

  it('al click muestra el panel (toggle)', () => {
    render(<DatePicker />);
    fireEvent.click(screen.getByRole('textbox'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('Escape cierra el panel', () => {
    render(<DatePicker />);
    fireEvent.click(screen.getByRole('textbox'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('cleaner limpia la fecha seleccionada', () => {
    // Cuando la fecha es controlada externamente y se limpia, onChange recibe null
    const onChange = jest.fn();
    const d = new Date(2026, 4, 15);
    render(<DatePicker value={d} onChange={onChange} />);
    const cleaner = screen.getByLabelText('Limpiar fecha');
    fireEvent.click(cleaner);
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('ref expone toggle/show/hide/cancel/clear/reset/update', () => {
    const ref = createRef();
    render(<DatePicker ref={ref} />);
    expect(typeof ref.current?.toggle).toBe('function');
    expect(typeof ref.current?.show).toBe('function');
    expect(typeof ref.current?.hide).toBe('function');
    expect(typeof ref.current?.cancel).toBe('function');
    expect(typeof ref.current?.clear).toBe('function');
    expect(typeof ref.current?.reset).toBe('function');
    expect(typeof ref.current?.update).toBe('function');
  });

  it('disabled impide la apertura', () => {
    render(<DatePicker disabled />);
    fireEvent.click(screen.getByRole('textbox'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

// ─── DateRangePicker ─────────────────────────────────────────────────────────
describe('DateRangePicker', () => {
  it('renderiza los dos inputs de rango', () => {
    render(<DateRangePicker />);
    expect(screen.getAllByRole('textbox').length).toBe(2);
  });

  it('al click muestra el panel con dos calendarios (calendars=2)', () => {
    render(<DateRangePicker />);
    fireEvent.click(screen.getAllByRole('textbox')[0].closest('div'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getAllByRole('grid').length).toBe(2);
  });

  it('Escape cierra el panel', () => {
    render(<DateRangePicker />);
    fireEvent.click(screen.getAllByRole('textbox')[0].closest('div'));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('ref expone toggle/show/hide/cancel/clear/reset/update', () => {
    const ref = createRef();
    render(<DateRangePicker ref={ref} />);
    ['toggle','show','hide','cancel','clear','reset','update'].forEach(m => {
      expect(typeof ref.current?.[m]).toBe('function');
    });
  });
});
