import React, { useEffect, useState } from 'react';
import { TopSellingProduct, ProductDetail } from '../../types/dashboard';
import { getProductDetail } from '../../services/dashboardService';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: TopSellingProduct | null;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  onClose,
  product
}) => {
  const [productDetail, setProductDetail] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && product) {
      setLoading(true);
      setError(null);

      getProductDetail(product.producto)
        .then(detail => {
          setProductDetail(detail);
        })
        .catch(err => {
          console.error('Error al obtener detalles del producto:', err);
          setError('No se pudieron cargar los detalles del producto');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (loading) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full p-8">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Cargando detalles del producto...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !productDetail) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full p-8">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="text-red-500 dark:text-red-400 text-lg mb-2">⚠️</div>
              <p className="text-red-600 dark:text-red-400">{error || 'Error al cargar los detalles'}</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              Detalles del Producto
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Producto Info */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {productDetail.nombre}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              productDetail.estado === 'activo'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            }`}>
              {productDetail.estado.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-green-600 dark:text-green-400">
                Ingresos Totales
              </h4>
              <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                Bs. {productDetail.ingresos_totales.toFixed(2)}
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Unidades Vendidas
              </h4>
              <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                {productDetail.unidades_vendidas}
              </p>
            </div>
          </div>
        </div>

        {/* Estadísticas Detalladas */}
        <div className="p-6">
          <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Información Adicional
          </h4>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Precio de Venta:
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Bs. {productDetail.precio_venta.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Categoría:
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {productDetail.categoria}
              </span>
            </div>

            {productDetail.marca && (
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Marca:
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {productDetail.marca}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Stock Actual:
              </span>
              <span className={`text-sm font-bold ${
                productDetail.stock_actual <= productDetail.stock_minimo
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400'
              }`}>
                {productDetail.stock_actual} unidades
                {productDetail.stock_actual <= productDetail.stock_minimo && (
                  <span className="ml-1 text-xs">(⚠️ Bajo stock)</span>
                )}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Stock Mínimo:
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {productDetail.stock_minimo} unidades
              </span>
            </div>

            {productDetail.proveedor_principal && (
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Proveedor Principal:
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {productDetail.proveedor_principal}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Margen de Ganancia:
              </span>
              <span className={`text-sm font-bold ${
                productDetail.margen_ganancia > 20
                  ? 'text-green-600 dark:text-green-400'
                  : productDetail.margen_ganancia > 10
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {productDetail.margen_ganancia.toFixed(1)}%
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Precio de Compra:
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Bs. {productDetail.precio_compra.toFixed(2)}
              </span>
            </div>

            {productDetail.ultima_venta && (
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Última Venta:
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {new Date(productDetail.ultima_venta).toLocaleDateString('es-ES')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              📊 Datos reales del sistema • Actualizado en tiempo real
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  console.log(`Navegando a editar producto ID: ${productDetail.producto_id}`);
                  // Aquí podrías navegar a la página de edición del producto
                  onClose();
                }}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                Ver/Editar Producto
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};