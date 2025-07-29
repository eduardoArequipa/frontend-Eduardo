import { Card, CardContent, CardHeader, CardTitle } from "../../components/Common/Card"; // Asumo que tienes un componente Card, si no, usa un div con estilos
import { DollarSign, AlertTriangle } from 'lucide-react'; // Íconos de ejemplo

interface KpiCardProps {
  title: string;
  value: string;
  icon: 'sales' | 'profit' | 'stock';
}

const icons = {
  sales: <DollarSign className="h-4 w-4 text-muted-foreground" />,
  profit: <DollarSign className="h-4 w-4 text-muted-foreground" />,
  stock: <AlertTriangle className="h-4 w-4 text-muted-foreground" />,
};


export const KpiCard = ({ title, value, icon }: KpiCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icons[icon]}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
};