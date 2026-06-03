/**
 * RevenueTrendChart — PracticaYoruba UI
 *
 * Grafico de linea de la tendencia de ingresos/ordenes del periodo,
 * construido con recharts. Complementa (no reemplaza) la tabla de la
 * serie temporal en los reportes admin.
 *
 * Activa la dependencia `recharts` (declarada en package.json pero con 0
 * usos previos en el codigo). UC-REP-01 / UC-REP-03.
 *
 * @param {object[]} data    — filas { date, revenue, orders }
 * @param {number}   height  — alto del grafico en px (default 280)
 * @param {string}   title   — titulo accesible del grafico
 */
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function RevenueTrendChart({
  data = [],
  height = 280,
  title = 'Grafico de tendencia de ingresos',
}) {
  // Normalizar revenue (puede venir como string decimal desde la API).
  const chartData = data.map((row) => ({
    date: row.date,
    revenue: toNumber(row.revenue),
    orders: toNumber(row.orders),
  }));

  if (chartData.length === 0) return null;

  return (
    <figure
      role="img"
      aria-label={title}
      style={{ width: '100%', height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="revenue" tick={{ fontSize: 12 }} />
          <YAxis
            yAxisId="orders"
            orientation="right"
            tick={{ fontSize: 12 }}
          />
          <Tooltip />
          <Legend />
          <Line
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            name="Ingresos"
            stroke="#8b5e3c"
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="orders"
            type="monotone"
            dataKey="orders"
            name="Órdenes"
            stroke="#3c6e8b"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </figure>
  );
}
