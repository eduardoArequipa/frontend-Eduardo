
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PurchaseStats as PurchaseStatsType } from '../../types/dashboard';
import { useTheme } from '../../context/ThemeContext'; // Importa el hook del tema

interface PurchasesStatsProps {
  data: PurchaseStatsType;
}

export const PurchasesStats = ({ data }: PurchasesStatsProps) => {
  const { theme } = useTheme(); // Obtiene el tema actual

  // Define los colores para los textos según el tema
  const tickColor = theme === 'dark' ? '#E5E7EB' : '#4B5563';

  return (
    <div className="space-y-8">
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
