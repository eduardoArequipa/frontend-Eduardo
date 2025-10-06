import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { InventoryByCategory } from '../../types/dashboard';
import { useState } from 'react';

interface CategoryChartProps {
  data: InventoryByCategory[];
  onCategoryClick?: (category: InventoryByCategory) => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const total = payload[0].payload.total || 0;
    const percentage = total > 0 ? ((data.valor_inventario / total) * 100) : 0;

    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
          {`Categoría: ${data.categoria}`}
        </p>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          <span className="font-medium">Valor Inventario:</span> Bs. {data.valor_inventario.toFixed(2)}
        </p>
        <p className="text-sm text-green-600 dark:text-green-400">
          <span className="font-medium">Porcentaje:</span> {percentage.toFixed(1)}%
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Click para filtrar por esta categoría
        </p>
      </div>
    );
  }
  return null;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#8884d8', '#82ca9d'];

export const CategoryChart = ({ data, onCategoryClick }: CategoryChartProps) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Calcular el total para los porcentajes
  const total = data.reduce((sum, item) => sum + item.valor_inventario, 0);
  const dataWithTotal = data.map(item => ({ ...item, total }));

  const handlePieClick = (entry: InventoryByCategory, index: number) => {
    setActiveIndex(index === activeIndex ? null : index);
    if (onCategoryClick) {
      onCategoryClick(entry);
    }
  };

  const handleMouseEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={dataWithTotal}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={activeIndex !== null ? 90 : 80}
          fill="#8884d8"
          paddingAngle={2}
          dataKey="valor_inventario"
          nameKey="categoria"
          onClick={handlePieClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          animationBegin={0}
          animationDuration={800}
          style={{ cursor: 'pointer' }}
        >
          {dataWithTotal.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
              stroke={activeIndex === index ? '#fff' : 'none'}
              strokeWidth={activeIndex === index ? 2 : 0}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value, entry: any) => {
            const percentage = entry?.payload?.valor_inventario ? ((entry.payload.valor_inventario / total) * 100) : 0;
            return `${value} (${percentage.toFixed(1)}%)`;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};