import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SalesDataPoint } from  '../../types/dashboard';

interface SalesChartProps {
  data: SalesDataPoint[];
}

export const SalesChart = ({ data }: SalesChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="period" />
        <YAxis />
        <Tooltip formatter={(value: number) => `Bs. ${value.toFixed(2)}`} />
        <Legend />
        <Bar dataKey="total" fill="#8884d8" name="Ventas (Bs.)" />
      </BarChart>
    </ResponsiveContainer>
  );
};