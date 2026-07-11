/**
 * Tests — DataTable (componente reutilizable)
 *
 * Cubre: render de columnas/filas, ordenamiento por columna (no-controlado),
 * filtro por columna, paginación de cliente (cambio de página), y los
 * estados loading / empty.
 *
 * Iniciativa: datatable-reutilizable-admin
 */
import { render, screen, fireEvent, within } from '@testing-library/react';
import DataTable from './DataTable';

const COLUMNS = [
  { key: 'name', header: 'Nombre', sortable: true },
  { key: 'age', header: 'Edad', sortable: true, align: 'right' },
  { key: 'city', header: 'Ciudad' },
];

const ROWS = [
  { id: 1, name: 'Carla', age: 30, city: 'Lagos' },
  { id: 2, name: 'Ana', age: 25, city: 'Ibadan' },
  { id: 3, name: 'Bruno', age: 40, city: 'Lagos' },
];

function bodyRowNames() {
  const rows = screen.getAllByRole('row');
  // row[0] es el header; las filas de datos vienen después.
  return rows
    .slice(1)
    .map((r) => within(r).queryAllByRole('cell')[0]?.textContent)
    .filter(Boolean);
}

describe('DataTable — render', () => {
  it('renderiza los headers y las filas', () => {
    render(<DataTable columns={COLUMNS} rows={ROWS} />);
    expect(screen.getByRole('button', { name: /Nombre/i })).toBeInTheDocument();
    expect(screen.getByText('Carla')).toBeInTheDocument();
    expect(screen.getByText('Ibadan')).toBeInTheDocument();
    expect(bodyRowNames()).toEqual(['Carla', 'Ana', 'Bruno']);
  });

  it('usa render() personalizado por columna', () => {
    const cols = [{ key: 'name', header: 'Nombre', render: (r) => <em>{`★ ${r.name}`}</em> }];
    render(<DataTable columns={cols} rows={[{ id: 1, name: 'Carla' }]} />);
    expect(screen.getByText('★ Carla')).toBeInTheDocument();
  });
});

describe('DataTable — ordenamiento', () => {
  it('ordena asc y luego desc al hacer clic en el header', () => {
    render(<DataTable columns={COLUMNS} rows={ROWS} />);
    const btn = screen.getByRole('button', { name: /Nombre/i });

    fireEvent.click(btn); // asc
    expect(bodyRowNames()).toEqual(['Ana', 'Bruno', 'Carla']);
    expect(btn.closest('th')).toHaveAttribute('aria-sort', 'ascending');

    fireEvent.click(btn); // desc
    expect(bodyRowNames()).toEqual(['Carla', 'Bruno', 'Ana']);
    expect(btn.closest('th')).toHaveAttribute('aria-sort', 'descending');
  });

  it('ordena numéricamente por la columna de edad', () => {
    render(<DataTable columns={COLUMNS} rows={ROWS} />);
    fireEvent.click(screen.getByRole('button', { name: /Edad/i }));
    expect(bodyRowNames()).toEqual(['Ana', 'Carla', 'Bruno']); // 25, 30, 40
  });

  it('no muestra botón de orden en columnas no-sortable', () => {
    render(<DataTable columns={COLUMNS} rows={ROWS} />);
    expect(screen.queryByRole('button', { name: /Ciudad/i })).not.toBeInTheDocument();
  });
});

describe('DataTable — filtro por columna', () => {
  it('filtra las filas por el texto de la columna', () => {
    render(<DataTable columns={COLUMNS} rows={ROWS} filterable />);
    const input = screen.getByLabelText(/Filtrar por Nombre/i);
    fireEvent.change(input, { target: { value: 'an' } });
    // 'Ana' (an) y 'Carla' no contienen 'an'... 'Ana' sí, 'Bruno' no, 'Carla' no.
    expect(bodyRowNames()).toEqual(['Ana']);
  });

  it('combina filtro de dos columnas (AND)', () => {
    render(<DataTable columns={COLUMNS} rows={ROWS} filterable />);
    fireEvent.change(screen.getByLabelText(/Filtrar por Ciudad/i), { target: { value: 'lagos' } });
    expect(bodyRowNames().sort()).toEqual(['Bruno', 'Carla']);
  });

  it('muestra estado vacío cuando el filtro no coincide', () => {
    render(<DataTable columns={COLUMNS} rows={ROWS} filterable emptyText="Nada aquí" />);
    fireEvent.change(screen.getByLabelText(/Filtrar por Nombre/i), { target: { value: 'zzz' } });
    expect(screen.getByText('Nada aquí')).toBeInTheDocument();
  });
});

describe('DataTable — paginación de cliente', () => {
  const MANY = Array.from({ length: 5 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}`, age: i, city: '-' }));

  it('muestra solo pageSize filas y navega entre páginas', () => {
    render(<DataTable columns={COLUMNS} rows={MANY} pageSize={2} />);
    expect(bodyRowNames()).toEqual(['Item 1', 'Item 2']);
    expect(screen.getByText(/Página 1 de 3/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Página siguiente/i }));
    expect(bodyRowNames()).toEqual(['Item 3', 'Item 4']);
    expect(screen.getByText(/Página 2 de 3/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Página anterior/i }));
    expect(bodyRowNames()).toEqual(['Item 1', 'Item 2']);
  });

  it('deshabilita Anterior en la primera página', () => {
    render(<DataTable columns={COLUMNS} rows={MANY} pageSize={2} />);
    expect(screen.getByRole('button', { name: /Página anterior/i })).toBeDisabled();
  });

  it('no renderiza paginación cuando todo cabe en una página', () => {
    render(<DataTable columns={COLUMNS} rows={ROWS} pageSize={10} />);
    expect(screen.queryByText(/Página/i)).not.toBeInTheDocument();
  });
});

describe('DataTable — estados loading / empty', () => {
  it('muestra el texto de carga cuando loading', () => {
    render(<DataTable columns={COLUMNS} rows={[]} loading loadingText="Cargando datos…" />);
    expect(screen.getByText('Cargando datos…')).toBeInTheDocument();
  });

  it('muestra el texto vacío cuando no hay filas', () => {
    render(<DataTable columns={COLUMNS} rows={[]} emptyText="Sin registros" />);
    expect(screen.getByText('Sin registros')).toBeInTheDocument();
  });
});

describe('DataTable — sort controlado', () => {
  it('invoca onSortChange y respeta el prop sort', () => {
    const onSortChange = jest.fn();
    const { rerender } = render(
      <DataTable columns={COLUMNS} rows={ROWS} sort={null} onSortChange={onSortChange} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Nombre/i }));
    expect(onSortChange).toHaveBeenCalledWith({ key: 'name', dir: 'asc' });

    rerender(
      <DataTable columns={COLUMNS} rows={ROWS} sort={{ key: 'name', dir: 'desc' }} onSortChange={onSortChange} />,
    );
    expect(bodyRowNames()).toEqual(['Carla', 'Bruno', 'Ana']);
  });
});

describe('DataTable — modo servidor (controlado)', () => {
  const serverRows = [
    { id: 1, name: 'Ana', age: 20, city: 'A' },
    { id: 2, name: 'Bruno', age: 25, city: 'B' },
  ];

  it('no corta las filas: renderiza rows tal cual (son la página actual)', () => {
    render(
      <DataTable columns={COLUMNS} rows={serverRows} total={60} page={1} pageCount={3} pageSize={25} />,
    );
    expect(bodyRowNames()).toEqual(['Ana', 'Bruno']);
  });

  it('muestra info total/página desde total y pageCount', () => {
    render(
      <DataTable columns={COLUMNS} rows={serverRows} total={60} page={2} pageCount={3} pageSize={25} />,
    );
    expect(screen.getByText(/60 entradas · Página 2 de 3/)).toBeInTheDocument();
  });

  it('invoca onPageChange al pulsar Siguiente / un número; Anterior deshabilitado en pág 1', () => {
    const onPageChange = jest.fn();
    render(
      <DataTable columns={COLUMNS} rows={serverRows} total={60} page={1} pageCount={3}
        pageSize={25} onPageChange={onPageChange} />,
    );
    expect(screen.getByRole('button', { name: /Página anterior/i })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /Página siguiente/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);
    fireEvent.click(screen.getByRole('button', { name: /^Página 3$/i }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('renderiza el selector de tamaño e invoca onPageSizeChange', () => {
    const onPageSizeChange = jest.fn();
    render(
      <DataTable columns={COLUMNS} rows={serverRows} total={60} page={1} pageCount={3}
        pageSize={25} pageSizeOptions={[25, 50, 100]} onPageSizeChange={onPageSizeChange} />,
    );
    fireEvent.change(screen.getByLabelText('Filas por página'), { target: { value: '100' } });
    expect(onPageSizeChange).toHaveBeenCalledWith(100);
  });

  it('captionHidden mantiene el <caption> accesible pero oculto', () => {
    render(
      <DataTable columns={COLUMNS} rows={serverRows} total={2} page={1} pageCount={1}
        pageSize={25} caption="Tabla de prueba" captionHidden />,
    );
    const cap = screen.getByText('Tabla de prueba');
    expect(cap.tagName).toBe('CAPTION');
  });
});
