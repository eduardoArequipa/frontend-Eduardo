import React from 'react';
import { DrillDownData } from '../../types/dashboard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: DrillDownData | null;
  title: string;
}

export const DrillDownModal: React.FC<DrillDownModalProps> = ({
  isOpen,
  onClose,
  data,
  title
}) => {
  if (!isOpen || !data) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {`Fecha: ${label}`}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            <span className="font-medium">Monto:</span> Bs. {data.amount.toFixed(2)}
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            <span className="font-medium">Transacciones:</span> {data.transactions}
          </p>
          <p className="text-sm text-purple-600 dark:text-purple-400">
            <span className="font-medium">Promedio por transacción:</span> Bs. {(data.amount / data.transactions).toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  const totalAmount = data.details.reduce((sum, item) => sum + item.amount, 0);
  const totalTransactions = data.details.reduce((sum, item) => sum + item.transactions, 0);
  const avgPerTransaction = totalTransactions > 0 ? totalAmount / totalTransactions : 0;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {title} - {data.period}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Resumen */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Total de Ventas
              </h3>
              <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                Bs. {totalAmount.toFixed(2)}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-600 dark:text-green-400">
                Total de Transacciones
              </h3>
              <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                {totalTransactions}
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-purple-600 dark:text-purple-400">
                Promedio por Transacción
              </h3>
              <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                Bs. {avgPerTransaction.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Gráfico detallado */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Tendencia Diaria
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.details}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-300 dark:text-gray-600" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  className="dark:fill-gray-300"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  className="dark:fill-gray-300"
                  yAxisId="amount"
                  orientation="left"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  className="dark:fill-gray-300"
                  yAxisId="transactions"
                  orientation="right"
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                  yAxisId="amount"
                  name="Monto (Bs.)"
                />
                <Line
                  type="monotone"
                  dataKey="transactions"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                  yAxisId="transactions"
                  name="Transacciones"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabla detallada */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Detalles por Día
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Monto (Bs.)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Transacciones
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Promedio por Transacción
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.details.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {item.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      Bs. {item.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {item.transactions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      Bs. {item.transactions > 0 ? (item.amount / item.transactions).toFixed(2) : '0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};