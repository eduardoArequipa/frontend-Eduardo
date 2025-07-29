// src/components/Common/LowStockNotification.tsx
import React from 'react';
import { useLowStock } from '../../context/LowStockContext';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const LowStockNotification: React.FC = () => {
    const { lowStockProducts, showNotification, loadingLowStock, errorLowStock, dismissNotification } = useLowStock();

    // No renderizar si no debe mostrarse y no hay nada cargando o con error
    if (!showNotification && !loadingLowStock && !errorLowStock) {
        return null;
    }

    // Mostrar spinner si está cargando
    if (loadingLowStock) {
        return (
            <div className="fixed top-4 right-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-md shadow-lg z-50 flex items-center space-x-2">
                <LoadingSpinner size="small" />
                <span>Verificando stock...</span>
            </div>
        );
    }

    // Mostrar mensaje de error si hay uno y la notificación debe mostrarse
    if (errorLowStock && showNotification) {
        // Asegurarse de que el mensaje de error sea una cadena legible.
        // Si errorLowStock es un objeto, lo convertimos a JSON string.
        const displayErrorMessage = typeof errorLowStock === 'object' && errorLowStock !== null
            ? JSON.stringify(errorLowStock, null, 2) // Formato JSON legible
            : String(errorLowStock); // Convertir a string si ya es una cadena o un tipo primitivo

        return (
            <div className="fixed top-4 right-4 z-50">
                <ErrorMessage message={displayErrorMessage} />
                <div className="flex justify-end mt-2">
                    <Button onClick={dismissNotification} variant="secondary" className="text-xs">
                        Cerrar
                    </Button>
                </div>
            </div>
        );
    }

    // Si hay productos con bajo stock, mostrar la notificación principal
    if (lowStockProducts.length > 0 && showNotification) {
        return (
            <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-6 py-4 rounded-lg shadow-xl z-50 max-w-sm">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-lg flex items-center">
                        ⚠️ Alerta de Stock Bajo
                    </h3>
                    <Button onClick={dismissNotification} variant="secondary" className="p-1 text-sm">
                        ✕
                    </Button>
                </div>
                <p className="text-sm mb-3">
                    Los siguientes productos están con stock bajo o cerca de agotarse:
                </p>
                <ul className="list-disc list-inside text-sm mb-4 max-h-40 overflow-y-auto pr-2">
                    {lowStockProducts.map(product => (
                        <li key={product.producto_id} className="mb-1">
                            <strong>{product.nombre}</strong> (Cód: {product.codigo}) - Stock: <span className="font-semibold text-red-700">{product.stock}</span> (Mín: {product.stock_minimo})
                        </li>
                    ))}
                </ul>
                <div className="text-right">
                    <Button onClick={dismissNotification} variant="primary" className="text-sm">
                        Entendido
                    </Button>
                </div>
            </div>
        );
    }

    // Si showNotification es false, o no hay productos y no hay error, no renderiza nada.
    return null;
};

export default LowStockNotification;
