import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TopSellingProduct } from '../../types/dashboard';
import { useState } from 'react';

interface TopProductsChartProps {
  data: TopSellingProduct[];
  onBarClick?: (product: TopSellingProduct) => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
          {`Producto: ${label}`}
        </p>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          <span className="font-medium">Ingresos Totales:</span> Bs. {value.toFixed(2)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Click para más detalles
        </p>
      </div>
    );
  }
  return null;
};

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

export const TopProductsChart = ({ data, onBarClick }: TopProductsChartProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleBarClick = (entry: TopSellingProduct) => {
    if (onBarClick) {
      onBarClick(entry);
    }
  };

  const getBarColor = (index: number) => {
    if (hoveredIndex === index) {
      return COLORS[index % COLORS.length].replace('d8', 'f1'); // Color más brillante
    }
    return COLORS[index % COLORS.length];
  };

  // Calcular ancho dinámico del eje Y basado en el producto más largo
  const maxProductLength = Math.max(...data.map(item => item.producto.length));
  const yAxisWidth = Math.min(Math.max(maxProductLength * 6, 80), 150);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="currentColor"
          className="text-gray-300 dark:text-gray-600"
        />
        <XAxis
          type="number"
          tick={{ fontSize: 12 }}
          className="dark:fill-gray-300"
          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
        />
        <YAxis
          dataKey="producto"
          type="category"
          width={yAxisWidth}
          tick={{ fontSize: 11 }}
          className="dark:fill-gray-300"
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar
          dataKey="ingresos_totales"
          name="Ingresos Totales (Bs.)"
          onClick={(entry) => handleBarClick(entry)}
          onMouseEnter={(_, index) => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          animationDuration={1000}
          animationBegin={200}
          style={{ cursor: 'pointer' }}
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={getBarColor(index)}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};