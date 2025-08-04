import { useEffect, useState } from 'react';
import { getDashboardData } from '../../services/dashboardService';
import { DashboardData, SalesDataPoint } from '../../types/dashboard';
import { KpiCard } from './KpiCard';
import { SalesChart } from './SalesChart';
import { TopProductsChart } from './TopProductsChart';
import { CategoryChart } from './CategoryChart';
import { PurchasesStats } from './PurchasesStats';
import { LowStockTable } from './LowStockTable';

type SalesPeriod = 'daily' | 'monthly' | 'yearly';

const DashboardPage = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salesPeriod, setSalesPeriod] = useState<SalesPeriod>('daily');

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

  const getIconForKpi = (title: string): 'sales' | 'profit' | 'stock' => {
    if (title.toLowerCase().includes('ventas')) return 'sales';
    if (title.toLowerCase().includes('ganancia')) return 'profit';
    return 'stock';
  };

  const getSalesData = (): SalesDataPoint[] => {
    switch (salesPeriod) {
      case 'monthly':
        return data.sales_monthly;
      case 'yearly':
        return data.sales_yearly;
      case 'daily':
      default:
        return data.sales_daily;
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Resumen General</h1>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {data.kpi_cards.map((card) => (
          <KpiCard key={card.title} title={card.title} value={card.value} icon={getIconForKpi(card.title)} />
        ))}
        <KpiCard title="Valor Total del Inventario" value={`Bs. ${data.total_inventory_value.toFixed(2)}`} icon="stock" />
      </div>

      {/* Gráfico de Ventas con selector */}
      <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Rendimiento de Ventas</h2>
            <div className="flex space-x-2">
                <button onClick={() => setSalesPeriod('daily')} className={`px-3 py-1 rounded-md text-sm ${salesPeriod === 'daily' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600 dark:text-gray-300'}`}>Diario</button>
                <button onClick={() => setSalesPeriod('monthly')} className={`px-3 py-1 rounded-md text-sm ${salesPeriod === 'monthly' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600 dark:text-gray-300'}`}>Mensual</button>
                <button onClick={() => setSalesPeriod('yearly')} className={`px-3 py-1 rounded-md text-sm ${salesPeriod === 'yearly' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600 dark:text-gray-300'}`}>Anual</button>
            </div>
        </div>
        <SalesChart data={getSalesData()} />
      </div>

      {/* Gráficos de Productos y Categorías */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Top 5 Productos Más Vendidos</h2>
          <TopProductsChart data={data.top_selling_products} />
        </div>
        <div className="lg:col-span-2 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Inventario por Categoría</h2>
          <CategoryChart data={data.inventory_by_category} />
        </div>
      </div>

      {/* Estadísticas de Compras y Stock Bajo */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Estadísticas de Compras</h2>
          <PurchasesStats data={data.purchase_stats} />
        </div>
        <div className="lg:col-span-2 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Productos con Bajo Stock</h2>
          <LowStockTable products={data.low_stock_products} />
        </div>
      </div>

    </div>
  );
};

export default DashboardPage;