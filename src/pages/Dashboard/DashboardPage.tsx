import { useEffect, useState } from 'react';
import { getDashboardData } from '../../services/dashboardService'; // Asegúrate de que la ruta sea correcta
import { DashboardData } from '../../types/dashboard'; // Asegúrate de que la ruta sea correcta
import { KpiCard } from '../Dashboard/KpiCard'; // Asegúrate de que la ruta sea correcta
import { SalesChart } from '../Dashboard/SalesChart'; // Asegúrate de que la ruta sea correcta
// Importa otros componentes de gráficos (TopProductsChart, etc.) aquí

const DashboardPage = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getDashboardData();
        setData(result);
      } catch (err) {
        setError('Error al cargar los datos del dashboard.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Cargando dashboard...</div>;
  }

  if (error || !data) {
    return <div className="text-red-500">{error || 'No se pudieron cargar los datos.'}</div>;
  }

  // Mapear los íconos basados en el título o un identificador
  const getIconForKpi = (title: string): 'sales' | 'profit' | 'stock' => {
      if (title.toLowerCase().includes('ventas')) return 'sales';
      if (title.toLowerCase().includes('ganancia')) return 'profit';
      return 'stock';
  }

  return (
    <div className="p-4 md:p-8 space-y-4">
      <h1 className="text-3xl font-bold">Resumen general</h1>

      {/* Sección de KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.kpi_cards.map((card) => (
          <KpiCard key={card.title} title={card.title} value={card.value} icon={getIconForKpi(card.title)} />
        ))}
      </div>

      {/* Sección de Gráficos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 p-4 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Rendimiento de Ventas (Últimos 30 días)</h2>
            <SalesChart data={data.sales_over_time} />
        </div>
        <div className="col-span-3 p-4 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Top 5 Productos</h2>
            {/* Aquí iría tu componente de gráfico de barras para Top Products */}
            <ul>
                {data.top_products.map(p => <li key={p.producto}>{p.producto} - Bs. {p.ingresos_totales.toFixed(2)}</li>)}
            </ul>
        </div>
      </div>
      
       {/* Aquí podrías agregar más componentes para el resto de los datos */}

    </div>
  );
};

export default DashboardPage;