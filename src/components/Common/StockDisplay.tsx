import React from 'react';
import { StockConvertido, DesglosePresentacion } from '../../types/producto';
import StockDesglosado from './StockDesglosado';

interface StockDisplayProps {
    stock: number;
    stockMinimo: number;
    stockConvertido?: StockConvertido | null;
    stockDesglosado?: DesglosePresentacion[] | null;
    unidadBase: {
        nombre_unidad: string;
        abreviatura: string;
    };
    isNewProduct?: boolean;
    className?: string;
}

const StockDisplay: React.FC<StockDisplayProps> = ({
    stock,
    stockMinimo,
    stockConvertido,
    stockDesglosado,
    unidadBase,
    isNewProduct = false,
    className = ""
}) => {
    // Determinar colores basados en el stock
    let stockTextColor = stock <= stockMinimo 
        ? 'text-red-600 dark:text-red-400' 
        : stock > stockMinimo * 2 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-yellow-600 dark:text-yellow-400';
    
    let stockBgColor = stock <= stockMinimo 
        ? 'bg-red-100 dark:bg-red-900/50' 
        : stock > stockMinimo * 2 
            ? 'bg-green-100 dark:bg-green-900/50' 
            : 'bg-yellow-100 dark:bg-yellow-900/50';

    if (isNewProduct) {
        return (
            <div className={`px-3 py-1 rounded-full text-center bg-gray-200 dark:bg-gray-700 ${className}`}>
                <p className="font-bold text-sm text-gray-500 dark:text-gray-400">0</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Stock</p>
            </div>
        );
    }

    // Mostrar desglose detallado si está disponible y hay múltiples presentaciones
    if (stockDesglosado && stockDesglosado.length > 1) {
        return (
            <div className={`px-3 py-1 rounded-lg text-center ${stockBgColor} ${className}`}>
                <div className={`font-bold text-sm ${stockTextColor} mb-1`}>
                    Stock Disponible
                </div>
                <StockDesglosado
                    desglose={stockDesglosado}
                    stockBase={stock}
                    unidadBase={unidadBase}
                    showTooltip={true}
                />
            </div>
        );
    }

    // Si hay stock convertido y es mayor a 0, mostrarlo (caso simple)
    if (stockConvertido && stockConvertido.cantidad > 0) {
        const tooltipText = `Stock base: ${stock} ${unidadBase.abreviatura}`;
        
        return (
            <div 
                className={`px-3 py-1 rounded-full text-center ${stockBgColor} ${className}`}
                title={tooltipText}
            >
                <p className={`font-bold text-sm ${stockTextColor}`}>
                    {stockConvertido.cantidad}
                    {stockConvertido.es_aproximado && <span className="text-xs ml-1">~</span>}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {stockConvertido.unidad_nombre}
                </p>
            </div>
        );
    }

    // Mostrar stock base si no hay conversión
    const tooltipText = stockConvertido ? `Stock base: ${stock} ${unidadBase.abreviatura}` : undefined;
    
    return (
        <div 
            className={`px-3 py-1 rounded-full text-center ${stockBgColor} ${className}`}
            title={tooltipText}
        >
            <p className={`font-bold text-sm ${stockTextColor}`}>{stock}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
                {unidadBase.abreviatura}
            </p>
        </div>
    );
};

export default StockDisplay;