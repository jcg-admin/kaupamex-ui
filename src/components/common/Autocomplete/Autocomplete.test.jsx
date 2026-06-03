// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/Autocomplete/Autocomplete.test.jsx
/**
 * Tests: Autocomplete — API completa de ui-core autocomplete.js
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { createRef } from 'react';
import Autocomplete from './Autocomplete';

const OPTS = ['Yemayá', 'Shangó', 'Obatalá', 'Oshún', 'Ogún'];

describe('Autocomplete — API completa ui-core', () => {
  it('muestra opciones filtradas al escribir', () => {
    render(<Autocomplete options={OPTS} placeholder="Buscar" />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'shún' } });
    // Los matches son locales → síncronos
    expect(screen.getByRole('option', { name: 'Oshún' })).toBeInTheDocument();
  });

  it('no muestra panel si el input está vacío', () => {
    render(<Autocomplete options={OPTS} />);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('ArrowDown / ArrowUp navegan las opciones', () => {
    render(<Autocomplete options={OPTS} />);
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const opts = screen.getAllByRole('option');
    expect(opts[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('Enter selecciona la opción activa', () => {
    const onSelect = jest.fn();
    render(<Autocomplete options={OPTS} onSelect={onSelect} />);
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'oshún' } });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('Oshún');
  });

  it('clearSearchOnSelect=true limpia el input al seleccionar (default)', () => {
    render(<Autocomplete options={OPTS} clearSearchOnSelect />);
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'oshún' } });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(input.value).toBe('');
  });

  it('cleaner=true muestra botón de limpiar', () => {
    render(<Autocomplete options={OPTS} cleaner />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'osh' } });
    expect(screen.getByLabelText('Limpiar selección')).toBeInTheDocument();
  });

  it('searchNoResultsLabel muestra mensaje cuando no hay resultados', () => {
    render(<Autocomplete options={OPTS} searchNoResultsLabel="Sin resultados" />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'xyz' } });
    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
  });

  it('externalSearch llama la función con el query', () => {
    const searchFn = jest.fn().mockReturnValue([]);
    render(<Autocomplete search={searchFn} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'test' } });
    expect(searchFn).toHaveBeenCalledWith('test');
  });

  it('ref expone toggle/show/hide/dispose/clear/search/update/deselectAll', () => {
    const ref = createRef();
    render(<Autocomplete options={OPTS} ref={ref} />);
    ['toggle','show','hide','dispose','clear','search','update','deselectAll'].forEach(m => {
      expect(typeof ref.current?.[m]).toBe('function');
    });
  });

  it('ref.clear() limpia el valor', () => {
    const ref = createRef();
    render(<Autocomplete options={OPTS} ref={ref} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'osh' } });
    act(() => ref.current.clear());
    expect(screen.getByRole('combobox').value).toBe('');
  });

  it('disabled bloquea el input y no abre el panel', () => {
    render(<Autocomplete options={OPTS} disabled />);
    fireEvent.click(screen.getByRole('combobox'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
