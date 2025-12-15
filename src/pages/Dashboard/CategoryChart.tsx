import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { InventoryByCategory } from '../../types/dashboard';
import { useState } from 'react';
import { generateCategoryInventoryPDF } from '../../utils/pdfTextGenerator';
import { obtenerFechaArchivo } from '../../utils/dateUtils';

interface CategoryChartProps {
  data: InventoryByCategory[];
  onCategoryClick?: (category: InventoryByCategory) => void;
  showExportButton?: boolean;
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

export const CategoryChart = ({ data, onCategoryClick, showExportButton = false }: CategoryChartProps) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Calcular el total para los porcentajes
  const total = data.reduce((sum, item) => sum + item.valor_inventario, 0);
  const dataWithTotal = data.map(item => ({ ...item, total }));

  const handlePieClick = (entry: InventoryByCategory, index: number) => {
    setActiveIndex(index === activeIndex ? null : index);
    if (onCategoryClick) {
      onCategoryClick(entry);
    }
  };

  const handleExportPDF = () => {
    try {
      setIsExporting(true);
      generateCategoryInventoryPDF(data, {
        filename: `Inventario_Por_Categoria_${obtenerFechaArchivo()}.pdf`,
      });
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Hubo un error al generar el PDF. Por favor, intenta de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleMouseEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  return (
    <div className="relative">
      {showExportButton && (
        <div className="absolute top-0 right-0 z-10">
          <button
            onClick={handleExportPDF}
            disabled={isExporting || data.length === 0}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isExporting || data.length === 0
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
            }`}
            title="Descargar PDF textual"
          >
            <svg
              className={`w-4 h-4 ${isExporting ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isExporting ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              )}
            </svg>
            <span className="hidden sm:inline">{isExporting ? 'Generando...' : 'PDF Textual'}</span>
          </button>
        </div>
      )}
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
    </div>
  );
};