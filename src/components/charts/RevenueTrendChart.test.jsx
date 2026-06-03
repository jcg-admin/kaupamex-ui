/**
 * Tests — RevenueTrendChart (PracticaYoruba UI)
 *
 * recharts se mockea: en jsdom no hay layout real (ResponsiveContainer
 * depende de ResizeObserver). Los mocks renderizan marcadores DOM que
 * permiten asertar el cableado de datos sin medir SVG.
 *
 * Los componentes mock se escriben en JSX (sin require interno) para
 * cumplir no-lazy-imports: babel inyecta el runtime JSX automatico, asi
 * que no hace falta importar React dentro de la factory de jest.mock.
 */
import { render, screen } from '@testing-library/react';

jest.mock('recharts', () => {
  const Passthrough = ({ children }) => <div>{children}</div>;
  return {
    __esModule: true,
    ResponsiveContainer: Passthrough,
    LineChart: ({ children, data }) => (
      <div data-recharts="LineChart" data-rows={data.length}>
        {children}
      </div>
    ),
    Line: ({ dataKey, name }) => (
      <div data-recharts="Line" data-key={dataKey} data-name={name} />
    ),
    XAxis: Passthrough,
    YAxis: Passthrough,
    CartesianGrid: Passthrough,
    Tooltip: Passthrough,
    Legend: Passthrough,
  };
});

import RevenueTrendChart from './RevenueTrendChart';

const SERIES = [
  { date: '2026-05-01', revenue: '1000.00', orders: 3 },
  { date: '2026-05-02', revenue: '1500.00', orders: 4 },
];

describe('RevenueTrendChart', () => {
  it('renderiza un figure accesible con el grafico', () => {
    render(<RevenueTrendChart data={SERIES} />);
    expect(
      screen.getByRole('img', { name: /tendencia de ingresos/i }),
    ).toBeInTheDocument();
  });

  it('pasa todas las filas de la serie al LineChart', () => {
    render(<RevenueTrendChart data={SERIES} />);
    const chart = document.querySelector('[data-recharts="LineChart"]');
    expect(chart).toHaveAttribute('data-rows', '2');
  });

  it('dibuja lineas para ingresos y ordenes', () => {
    render(<RevenueTrendChart data={SERIES} />);
    const lines = document.querySelectorAll('[data-recharts="Line"]');
    const keys = Array.from(lines).map((l) => l.getAttribute('data-key'));
    expect(keys).toEqual(expect.arrayContaining(['revenue', 'orders']));
  });

  it('no renderiza nada cuando la serie esta vacia', () => {
    const { container } = render(<RevenueTrendChart data={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
