// src/components/Common/LowStockNotification.tsx
import React from 'react';
import { useLowStock } from '../../context/LowStockContext';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
// import { Conversion } from '../../types/producto'; // ✅ Eliminado
import Modal from './Modal';
import { formatStockDisplay } from '../../utils/formatUtils'; // ✅ Importado desde utilidades

// --- Icono SVG para la Alerta ---
const WarningIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

// --- Componente Principal ---
const LowStockNotification: React.FC = () => {
    const { lowStockProducts, showNotification, loadingLowStock, errorLowStock, dismissNotification } = useLowStock();
    // const { productos: allProducts, conversiones: allConversions } = useCatalogs(); // ✅ Eliminado

    // ✅ Eliminado productosMap ya que lowStockProducts ahora se asume completo
    // const productosMap = useMemo(() => {
    //     const map = new Map();
    //     allProducts.forEach(p => map.set(p.producto_id, p));
    //     return map;
    // }, [allProducts]);

    if (!showNotification && !loadingLowStock && !errorLowStock) return null;

    if (loadingLowStock) {
        return (
            <div className="fixed top-5 right-5 bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-3">
                <LoadingSpinner size="sm" />
                <span>Verificando stock...</span>
            </div>
        );
    }

    if (errorLowStock && showNotification) {
        return (
            <Modal
                isOpen={showNotification}
                onClose={dismissNotification}
                title="Error de Verificación"
                widthClass="max-w-md"
                showConfirmButton={false}
                showCancelButton={true}
                cancelButtonText="Cerrar"
            >
                <ErrorMessage message={String(errorLowStock)} />
            </Modal>
        );
    }

    if (lowStockProducts.length > 0 && showNotification) {
        return (
            <Modal
                isOpen={showNotification}
                onClose={dismissNotification}
                title="Alerta de Stock Bajo"
                widthClass="max-w-lg"
                showConfirmButton={false}
                showCancelButton={false}
            >
                <div className="flex items-start">
                    <WarningIcon />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Los siguientes productos requieren atención por tener un inventario bajo o cercano al mínimo establecido.
                    </p>
                </div>

                <ul className="space-y-3 max-h-64 overflow-y-auto pr-2 mt-4">
                    {lowStockProducts.map(product => {
                        // ✅ Acceso directo a las propiedades del producto
                        const productConversions = product.conversiones || []; 
                        const unidadBase = product.unidad_inventario?.nombre_unidad || 'Unidad';
                        const formattedStock = formatStockDisplay(Number(product.stock), productConversions, unidadBase);
                        const formattedMinStock = formatStockDisplay(Number(product.stock_minimo), productConversions, unidadBase);

                        return (
                            <li key={product.producto_id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700/50">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">{product.nombre}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Cód: {product.codigo}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-4">
                                        <p className="font-bold text-red-600 dark:text-red-500">{formattedStock}</p>
                                        <p className="text-xs text-gray-500">Mín: <span className="font-bold">{formattedMinStock}</span></p>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>

                <div className="mt-6 text-right">
                    <Button onClick={dismissNotification} variant="primary" size="sm">
                        Entendido
                    </Button>
                </div>
            </Modal>
        );
    }

    return null;
};

export default LowStockNotification;
