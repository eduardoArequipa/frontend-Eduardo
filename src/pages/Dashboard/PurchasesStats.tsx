
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PurchaseStats as PurchaseStatsType } from '../../types/dashboard';
import { useTheme } from '../../context/ThemeContext'; // Importa el hook del tema
import { generatePurchaseStatsPDF } from '../../utils/pdfTextGenerator';
import { obtenerFechaArchivo } from '../../utils/dateUtils';
import { useState } from 'react';

interface PurchasesStatsProps {
  data: PurchaseStatsType;
  showExportButton?: boolean;
}

export const PurchasesStats = ({ data, showExportButton = false }: PurchasesStatsProps) => {
  const { theme } = useTheme(); // Obtiene el tema actual
  const [isExporting, setIsExporting] = useState(false);

  // Define los colores para los textos según el tema
  const tickColor = theme === 'dark' ? '#E5E7EB' : '#4B5563';

  const handleExportPDF = () => {
    try {
      setIsExporting(true);
      generatePurchaseStatsPDF(data, {
        filename: `Estadisticas_Compras_${obtenerFechaArchivo()}.pdf`,
      });
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Hubo un error al generar el PDF. Por favor, intenta de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 relative">
      {showExportButton && (
        <div className="absolute top-0 right-0 z-10">
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isExporting
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
      <div>
        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Top 5 Proveedores (por Total Comprado)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart layout="vertical" data={data.top_suppliers}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-300 dark:text-gray-600" />
            <XAxis type="number" stroke={tickColor} />
            <YAxis dataKey="proveedor" type="category" width={80} tick={{ fill: tickColor }} />
            <Tooltip 
              wrapperClassName="rounded-md shadow-lg" 
              contentStyle={{ backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF', border: '1px solid #4B5563' }}
              labelStyle={{ color: theme === 'dark' ? '#F9FAFB' : '#111827' }}
              formatter={(value: number) => [`Bs. ${value.toFixed(2)}`, 'Total Comprado']}
            />
            <Legend />
            <Bar dataKey="total_compras" name="Total Comprado" fill="#2ca02c" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Top 5 Productos (por Cantidad Comprada)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart layout="vertical" data={data.top_purchased_products}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-300 dark:text-gray-600" />
            <XAxis type="number" stroke={tickColor} />
            <YAxis dataKey="producto" type="category" width={80} tick={{ fill: tickColor }} />
            <Tooltip 
              wrapperClassName="rounded-md shadow-lg" 
              contentStyle={{ backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF', border: '1px solid #4B5563' }}
              labelStyle={{ color: theme === 'dark' ? '#F9FAFB' : '#111827' }}
            />
            <Legend />
            <Bar dataKey="cantidad_comprada" name="Cantidad Comprada" fill="#ff7f0e" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
