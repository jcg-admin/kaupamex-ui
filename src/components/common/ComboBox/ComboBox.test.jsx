/**
 * Tests del ComboBox nativo (adaptado de kno-react-dropdowns).
 * Verifica el contrato público: onChange({value}), onFilterChange({filter}),
 * apertura/cierre, textField, clearButton y estado loading.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import ComboBox from './ComboBox';
import { filterBy } from '@lib/dataQuery';

const PAISES = [
  { id: 'mx', name: 'México' },
  { id: 'us', name: 'Estados Unidos' },
  { id: 'ar', name: 'Argentina' },
];

describe('ComboBox', () => {
  it('abre la lista al enfocar y muestra las opciones por textField', () => {
    render(<ComboBox data={PAISES} textField="name" dataItemKey="id" label="País" />);
    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    fireEvent.focus(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('option', { name: 'México' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Argentina' })).toBeInTheDocument();
  });

  it('emite onChange({value}) con el item al seleccionar', () => {
    const onChange = jest.fn();
    render(<ComboBox data={PAISES} textField="name" dataItemKey="id" onChange={onChange} />);
    fireEvent.focus(screen.getByRole('combobox'));
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Estados Unidos' }));
    expect(onChange).toHaveBeenCalledWith({ value: { id: 'us', name: 'Estados Unidos' } });
  });

  it('emite onFilterChange({filter}) con el descriptor al teclear (filterable)', () => {
    const onFilterChange = jest.fn();
    render(
      <ComboBox
        data={PAISES}
        textField="name"
        dataItemKey="id"
        filterable
        onFilterChange={onFilterChange}
      />,
    );
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'mé' } });
    expect(onFilterChange).toHaveBeenCalledWith({
      filter: { field: 'name', operator: 'contains', value: 'mé', ignoreCase: true },
    });
  });

  it('integra con filterBy en un consumidor controlado', () => {
    function Host() {
      const [data, setData] = useState(PAISES);
      const [filter, setFilter] = useState(null);
      return (
        <ComboBox
          data={data}
          textField="name"
          dataItemKey="id"
          filterable
          filter={filter}
          onFilterChange={(e) => {
            setFilter(e.filter);
            setData(filterBy(PAISES, e.filter));
          }}
        />
      );
    }
    render(<Host />);
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'arg' } });
    expect(screen.getByRole('option', { name: 'Argentina' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'México' })).not.toBeInTheDocument();
  });

  it('muestra el Loader cuando loading=true', () => {
    render(<ComboBox data={PAISES} textField="name" loading />);
    expect(screen.getByLabelText('Cargando opciones')).toBeInTheDocument();
  });

  it('el botón limpiar dispara onChange({value:null})', () => {
    const onChange = jest.fn();
    render(
      <ComboBox
        data={PAISES}
        textField="name"
        dataItemKey="id"
        value={{ id: 'mx', name: 'México' }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByLabelText('Limpiar selección'));
    expect(onChange).toHaveBeenCalledWith({ value: null });
  });
});
