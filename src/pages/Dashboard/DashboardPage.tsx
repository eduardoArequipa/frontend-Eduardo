import { useEffect, useState } from 'react';
import { getDashboardData, getDrillDownData } from '../../services/dashboardService';
import { DashboardData, SalesDataPoint, DashboardFilters, DrillDownData, InventoryByCategory, TopSellingProduct } from '../../types/dashboard';
import { KpiCard } from './KpiCard';
import { SalesChart } from './SalesChart';
import { TopProductsChart } from './TopProductsChart';
import { CategoryChart } from './CategoryChart';
import { PurchasesStats } from './PurchasesStats';
import { LowStockTable } from './LowStockTable';
import { DashboardFilters as FiltersComponent } from './DashboardFilters';
import { DrillDownModal } from './DrillDownModal';
import { ProductDetailModal } from './ProductDetailModal';

type SalesPeriod = 'daily' | 'monthly' | 'yearly';

const DashboardPage = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salesPeriod, setSalesPeriod] = useState<SalesPeriod>('daily');
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [drillDownData, setDrillDownData] = useState<DrillDownData | null>(null);
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);
  const [drillDownTitle, setDrillDownTitle] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<TopSellingProduct | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getDashboardData(filters);

        // Los datos de categorías y proveedores ahora vienen del backend
        const enhancedResult = {
          ...result,
          // Fallback si el backend no devuelve estas listas
          available_categories: result.available_categories || result.inventory_by_category.map(cat => cat.categoria),
          available_suppliers: result.available_suppliers || result.purchase_stats.top_suppliers.map(sup => sup.proveedor),
        };

        setData(enhancedResult);
      } catch (err) {
        setError('Error al cargar los datos del dashboard.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]); // Recargar cuando cambien los filtros

  // Función para manejar clicks en barras de ventas (drill-down)
  const handleSalesBarClick = async (salesData: SalesDataPoint) => {
    try {
      const drillDownResult = await getDrillDownData(salesData.period, 'sales');
      setDrillDownData(drillDownResult);
      setDrillDownTitle(`Detalles de Ventas`);
      setIsDrillDownOpen(true);
    } catch (error) {
      console.error('Error al obtener datos de drill-down:', error);
      // Fallback con datos simulados si falla el backend
      const mockDrillDownData: DrillDownData = {
        period: salesData.period,
        details: Array.from({ length: 7 }, (_, i) => ({
          date: `${salesData.period}-${String(i + 1).padStart(2, '0')}`,
          amount: Math.random() * 5000 + 1000,
          transactions: Math.floor(Math.random() * 50) + 10
        }))
      };
      setDrillDownData(mockDrillDownData);
      setDrillDownTitle(`Detalles de Ventas`);
      setIsDrillDownOpen(true);
    }
  };

  // Función para manejar clicks en productos
  const handleProductClick = (product: TopSellingProduct) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  // Función para manejar clicks en categorías
  const handleCategoryClick = (category: InventoryByCategory) => {
    setFilters({
      ...filters,
      category: category.categoria
    });
  };

  // Función para resetear filtros
  const handleResetFilters = () => {
    setFilters({});
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Cargando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 md:p-8 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 dark:text-red-400 text-lg mb-2">⚠️</div>
            <p className="text-red-600 dark:text-red-400">{error || 'No se pudieron cargar los datos.'}</p>
          </div>
        </div>
      </div>
    );
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
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Dashboard Interactivo</h1>
        {(filters.category || filters.supplier || filters.startDate || filters.endDate) && (
          <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
            Filtros activos
          </div>
        )}
      </div>

      {/* Filtros Avanzados */}
      <FiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        availableCategories={data.available_categories || []}
        availableSuppliers={data.available_suppliers || []}
        onReset={handleResetFilters}
      />

      {/* KPIs */}
      <div id="kpi-section" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {data.kpi_cards.map((card) => (
          <KpiCard key={card.title} title={card.title} value={card.value} icon={getIconForKpi(card.title)} />
        ))}
      </div>

      {/* Gráfico de Ventas con selector y comparación */}
      <div id="sales-chart-section" className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Rendimiento de Ventas Interactivo</h2>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showComparison"
                checked={filters.compareWithPrevious || false}
                onChange={(e) => setFilters({ ...filters, compareWithPrevious: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="showComparison" className="text-sm text-gray-600 dark:text-gray-300">
                Comparar con período anterior
              </label>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => setSalesPeriod('daily')} className={`px-3 py-1 rounded-md text-sm transition-colors ${salesPeriod === 'daily' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'}`}>Diario</button>
              <button onClick={() => setSalesPeriod('monthly')} className={`px-3 py-1 rounded-md text-sm transition-colors ${salesPeriod === 'monthly' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'}`}>Mensual</button>
              <button onClick={() => setSalesPeriod('yearly')} className={`px-3 py-1 rounded-md text-sm transition-colors ${salesPeriod === 'yearly' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'}`}>Anual</button>
            </div>
          </div>
        </div>
        <div className="mb-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            💡 <span className="font-medium">Funciones interactivas:</span> Click en las barras para ver detalles, usa el control inferior para zoom y navegación
          </p>
        </div>
        <SalesChart
          data={getSalesData()}
          onBarClick={handleSalesBarClick}
          showComparison={filters.compareWithPrevious || false}
          period={salesPeriod}
          showExportButton={true}
        />
      </div>

      {/* Gráficos de Productos y Categorías */}
      <div id="products-categories-section" className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Top 5 Productos Más Vendidos</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            💡 Click en las barras para ver detalles del producto
          </p>
          <TopProductsChart
            data={data.top_selling_products}
            onBarClick={handleProductClick}
            showExportButton={true}
          />
        </div>
        <div className="lg:col-span-2 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Inventario por Categoría</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            💡 Click en una sección para filtrar por esa categoría
          </p>
          <CategoryChart
            data={data.inventory_by_category}
            onCategoryClick={handleCategoryClick}
            showExportButton={true}
          />
        </div>
      </div>

      {/* Estadísticas de Compras y Stock Bajo */}
      <div id="purchases-stock-section" className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Estadísticas de Compras Mejoradas</h2>
          <PurchasesStats data={data.purchase_stats} showExportButton={true} />
        </div>
        <div className="lg:col-span-2 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Productos con Bajo Stock</h2>
          <LowStockTable products={data.low_stock_products} showExportButton={true} />
        </div>
      </div>

      {/* Modal de Drill-Down */}
      <DrillDownModal
        isOpen={isDrillDownOpen}
        onClose={() => setIsDrillDownOpen(false)}
        data={drillDownData}
        title={drillDownTitle}
      />

      {/* Modal de Detalles de Producto */}
      <ProductDetailModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={selectedProduct}
      />
    </div>
  );
};

export default DashboardPage;