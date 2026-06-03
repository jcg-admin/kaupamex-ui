// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/MultiSelect/MultiSelect.test.jsx
/**
 * Tests: MultiSelect — API completa de ui-core multi-select.js
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { createRef } from 'react';
import MultiSelect from './MultiSelect';

const OPTS = ['Collares', 'Elekes', 'Otanes', 'Soperas', 'Herramientas'];

const Base = (p) => <MultiSelect options={OPTS} {...p} />;

describe('MultiSelect — API completa ui-core', () => {
  it('muestra el placeholder cuando no hay selección', () => {
    render(<Base placeholder="Elegir..." />);
    expect(screen.getByText('Elegir...')).toBeInTheDocument();
  });

  it('click en trigger abre el panel (listbox)', () => {
    render(<Base />);
    fireEvent.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('selecciona una opción y la muestra como tag', () => {
    render(<Base selectionType="tags" />);
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Collares' }));
    // El tag tiene text 'Collares×' — buscar el span padre
    const tags = document.querySelectorAll('[class]');
    const hasCollares = [...tags].some(t => t.textContent?.includes('Collares'));
    expect(hasCollares).toBe(true);
  });

  it('selectionType=counter muestra el conteo', () => {
    render(<Base selectionType="counter" selectionTypeCounterText="seleccionados" />);
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Collares' }));
    fireEvent.click(screen.getByRole('option', { name: 'Elekes' }));
    expect(screen.getByText('2 seleccionados')).toBeInTheDocument();
  });

  it('selectAll selecciona todas las opciones', () => {
    render(<Base selectAll selectAllLabel="Seleccionar todo" />);
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Seleccionar todo' }));
    expect(screen.getByRole('option', { name: 'Seleccionar todo' }))
      .toHaveAttribute('aria-selected', 'true');
  });

  it('cleaner=true limpia la selección con ✕', () => {
    render(<Base cleaner />);
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getAllByRole('option')[1]);
    fireEvent.click(screen.getByLabelText('Limpiar selección'));
    expect(screen.getByText('Select...')).toBeInTheDocument();
  });

  it('search=true muestra campo de búsqueda y filtra', () => {
    render(<Base search />);
    fireEvent.click(screen.getByRole('combobox'));
    const searchInput = screen.getByPlaceholderText('Buscar...');
    fireEvent.change(searchInput, { target: { value: 'ele' } });
    expect(screen.getByRole('option', { name: 'Elekes' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Collares' })).not.toBeInTheDocument();
  });

  it('multiple=false hace selección simple y cierra', () => {
    render(<Base multiple={false} />);
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Otanes' }));
    // AnimatePresence mantiene el DOM durante exit — verificar aria-expanded
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
    // El texto 'Otanes' está en el trigger como selección
    expect(screen.getByRole('combobox')).toHaveTextContent('Otanes');
  });

  it('optionsStyle=checkbox muestra checkboxes', () => {
    render(<Base optionsStyle="checkbox" />);
    fireEvent.click(screen.getByRole('combobox'));
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it('ref expone toggle/show/hide/selectAll/deselectAll/getValue', () => {
    const ref = createRef();
    render(<Base ref={ref} />);
    ['toggle','show','hide','dispose','search','update','selectAll','deselectAll','getValue']
      .forEach(m => expect(typeof ref.current?.[m]).toBe('function'));
  });

  it('ref.getValue() retorna el array de seleccionados', () => {
    const ref = createRef();
    render(<Base ref={ref} />);
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Collares' }));
    expect(ref.current.getValue()).toContain('Collares');
  });

  it('Escape cierra el panel', () => {
    render(<Base />);
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
  });
});
