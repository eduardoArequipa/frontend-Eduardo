import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TopSellingProduct } from '../../types/dashboard';
import { useState } from 'react';
import { generateTopProductsPDF } from '../../utils/pdfTextGenerator';
import { obtenerFechaArchivo } from '../../utils/dateUtils';

interface TopProductsChartProps {
  data: TopSellingProduct[];
  onBarClick?: (product: TopSellingProduct) => void;
  showExportButton?: boolean;
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

export const TopProductsChart = ({ data, onBarClick, showExportButton = false }: TopProductsChartProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleBarClick = (entry: TopSellingProduct) => {
    if (onBarClick) {
      onBarClick(entry);
    }
  };

  const handleExportPDF = () => {
    try {
      setIsExporting(true);
      generateTopProductsPDF(data, {
        filename: `Top_5_Productos_${obtenerFechaArchivo()}.pdf`,
        title: 'Top 5 Productos Más Vendidos',
        subtitle: 'Reporte de Productos con Mayores Ingresos',
      });
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Hubo un error al generar el PDF. Por favor, intenta de nuevo.');
    } finally {
      setIsExporting(false);
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
    </div>
  );
};