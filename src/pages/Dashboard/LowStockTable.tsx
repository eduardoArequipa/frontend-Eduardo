
import { LowStockProduct } from '../../types/dashboard';
import { Link } from 'react-router-dom';
import { generateLowStockPDF } from '../../utils/pdfTextGenerator';
import { obtenerFechaArchivo } from '../../utils/dateUtils';
import { useState } from 'react';

interface LowStockTableProps {
  products: LowStockProduct[];
  showExportButton?: boolean;
}

export const LowStockTable = ({ products, showExportButton = false }: LowStockTableProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = () => {
    try {
      setIsExporting(true);
      generateLowStockPDF(products, {
        filename: `Productos_Bajo_Stock_${obtenerFechaArchivo()}.pdf`,
      });
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Hubo un error al generar el PDF. Por favor, intenta de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  if (products.length === 0) {
    return <p className="text-gray-600 dark:text-gray-400">No hay productos con bajo stock.</p>;
  }

  return (
    <div className="overflow-x-auto relative">
      {showExportButton && (
        <div className="absolute top-0 right-0 z-10 mb-2">
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
      <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Producto</th>
            <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-600 dark:text-gray-300">Stock Actual</th>
            <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-600 dark:text-gray-300">Stock Mínimo</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.producto_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200">
                <Link to={`/producto/edit/${product.producto_id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  {product.nombre}
                </Link>
              </td>
              <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-center text-red-500 font-bold">{product.stock}</td>
              <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-center text-sm text-gray-800 dark:text-gray-200">{product.stock_minimo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
