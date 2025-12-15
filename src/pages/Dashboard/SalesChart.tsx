import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush, Cell } from 'recharts';
import { SalesDataPoint } from  '../../types/dashboard';
import { useState } from 'react';
import { generateSalesPDF } from '../../utils/pdfTextGenerator';
import { obtenerFechaArchivo } from '../../utils/dateUtils';

interface SalesChartProps {
  data: SalesDataPoint[];
  onBarClick?: (data: SalesDataPoint) => void;
  showComparison?: boolean;
  period?: 'daily' | 'monthly' | 'yearly';
  showExportButton?: boolean;
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

export const SalesChart = ({ data, onBarClick, showComparison = false, period = 'daily', showExportButton = false }: SalesChartProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleBarClick = (entry: any) => {
    if (onBarClick) {
      onBarClick(entry);
    }
  };

  const handleExportPDF = () => {
    try {
      setIsExporting(true);
      generateSalesPDF(data, period, {
        filename: `Ventas_${period}_${obtenerFechaArchivo()}.pdf`,
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
      return "#6366f1"; // Color más brillante al hover
    }
    return "#8884d8"; // Color normal
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
    </div>
  );
};