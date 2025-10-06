import React from 'react';
import { DashboardFilters as FilterType } from '../../types/dashboard';

interface DashboardFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
  availableCategories: string[];
  availableSuppliers: string[];
  onReset: () => void;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  filters,
  onFiltersChange,
  availableCategories,
  availableSuppliers,
  onReset
}) => {
  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value
    });
  };

  const handleSelectChange = (field: 'category' | 'supplier', value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value || undefined
    });
  };

  const handleCompareChange = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      compareWithPrevious: checked
    });
  };

  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 w-full mb-2">
          Filtros Avanzados
        </h3>

        {/* Filtros de fecha */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
            Fecha Inicio
          </label>
          <input
            type="date"
            value={filters.startDate || thirtyDaysAgo}
            onChange={(e) => handleDateChange('startDate', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
            Fecha Fin
          </label>
          <input
            type="date"
            value={filters.endDate || today}
            onChange={(e) => handleDateChange('endDate', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filtro por categoría */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
            Categoría
          </label>
          <select
            value={filters.category || ''}
            onChange={(e) => handleSelectChange('category', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[150px]"
          >
            <option value="">Todas las categorías</option>
            {availableCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Filtro por proveedor */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
            Proveedor
          </label>
          <select
            value={filters.supplier || ''}
            onChange={(e) => handleSelectChange('supplier', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[150px]"
          >
            <option value="">Todos los proveedores</option>
            {availableSuppliers.map(supplier => (
              <option key={supplier} value={supplier}>{supplier}</option>
            ))}
          </select>
        </div>

        {/* Comparar con período anterior */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="compareWithPrevious"
            checked={filters.compareWithPrevious || false}
            onChange={(e) => handleCompareChange(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label htmlFor="compareWithPrevious" className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-300">
            Comparar con período anterior
          </label>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2">
          <button
            onClick={onReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Limpiar Filtros
          </button>

          {/* Filtros rápidos */}
          <div className="flex gap-1 ml-4">
            <button
              onClick={() => onFiltersChange({
                ...filters,
                startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                endDate: today
              })}
              className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30"
            >
              Últimos 7 días
            </button>
            <button
              onClick={() => onFiltersChange({
                ...filters,
                startDate: thirtyDaysAgo,
                endDate: today
              })}
              className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30"
            >
              Últimos 30 días
            </button>
            <button
              onClick={() => onFiltersChange({
                ...filters,
                startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                endDate: today
              })}
              className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30"
            >
              Últimos 90 días
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};