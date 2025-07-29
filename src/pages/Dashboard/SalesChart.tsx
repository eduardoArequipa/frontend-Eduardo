import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SalesOverTimePoint } from  '../../types/dashboard';

interface SalesChartProps {
  data: SalesOverTimePoint[];
}

export const SalesChart = ({ data }: SalesChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="dia" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="total_ventas" stroke="#8884d8" name="Ventas (Bs.)" />
      </LineChart>
    </ResponsiveContainer>
  );
};