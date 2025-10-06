import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush, Cell } from 'recharts';
import { SalesDataPoint } from  '../../types/dashboard';
import { useState } from 'react';

interface SalesChartProps {
  data: SalesDataPoint[];
  onBarClick?: (data: SalesDataPoint) => void;
  showComparison?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as SalesDataPoint;
    const currentValue = payload[0].value;
    const previousValue = data.previousPeriodTotal;
    const quantity = data.quantity;

    let changePercentage = 0;
    if (previousValue && previousValue > 0) {
      changePercentage = ((currentValue - previousValue) / previousValue) * 100;
    }

    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
          {`Período: ${label}`}
        </p>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          <span className="font-medium">Ventas:</span> Bs. {currentValue.toFixed(2)}
        </p>
        {quantity && (
          <p className="text-sm text-green-600 dark:text-green-400">
            <span className="font-medium">Transacciones:</span> {quantity}
          </p>
        )}
        {previousValue && (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Período anterior:</span> Bs. {Number(previousValue).toFixed(2)}
            </p>
            <p className={`text-sm font-medium ${
              changePercentage > 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              <span className="font-medium">Cambio:</span> {changePercentage > 0 ? '+' : ''}{changePercentage.toFixed(1)}%
            </p>
          </>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Click para ver detalles
        </p>
      </div>
    );
  }
  return null;
};

export const SalesChart = ({ data, onBarClick, showComparison = false }: SalesChartProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleBarClick = (entry: any) => {
    if (onBarClick) {
      onBarClick(entry);
    }
  };

  const getBarColor = (index: number) => {
    if (hoveredIndex === index) {
      return "#6366f1"; // Color más brillante al hover
    }
    return "#8884d8"; // Color normal
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="currentColor"
          className="text-gray-300 dark:text-gray-600"
        />
        <XAxis
          dataKey="period"
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={60}
          className="dark:fill-gray-300"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          className="dark:fill-gray-300"
          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
        />
        <Legend />

        {/* Barra principal de ventas */}
        <Bar
          dataKey="total"
          name="Ventas (Bs.)"
          onClick={handleBarClick}
          onMouseEnter={(_, index) => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          animationBegin={0}
          animationDuration={800}
          style={{ cursor: 'pointer' }}
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={getBarColor(index)}
            />
          ))}
        </Bar>

        {/* Barra de comparación si está habilitada */}
        {showComparison && (
          <Bar
            dataKey="previousPeriodTotal"
            name="Período Anterior (Bs.)"
            fill="#94a3b8"
            opacity={0.7}
            animationBegin={200}
            animationDuration={600}
          />
        )}

        {/* Brush para zoom y pan */}
        <Brush
          dataKey="period"
          height={30}
          stroke="#8884d8"
          fill="currentColor"
          className="text-gray-100 dark:text-gray-700"
        />
      </BarChart>
    </ResponsiveContainer>
  );
};