import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TopSellingProduct } from '../../types/dashboard';

interface TopProductsChartProps {
  data: TopSellingProduct[];
}

export const TopProductsChart = ({ data }: TopProductsChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
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
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="producto" type="category" width={80} />
        <Tooltip wrapperClassName="text-black" />
        <Legend />
        <Bar dataKey="ingresos_totales" name="Ingresos Totales" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
};