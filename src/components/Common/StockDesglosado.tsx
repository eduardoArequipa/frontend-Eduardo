import React from 'react';
import { DesglosePresentacion } from '../../types/producto';

interface StockDesglosadoProps {
    desglose: DesglosePresentacion[];
    stockBase: number;
    unidadBase: {
        nombre_unidad: string;
        abreviatura: string;
    };
    className?: string;
    showTooltip?: boolean;
}

const StockDesglosado: React.FC<StockDesglosadoProps> = ({
    desglose,
    stockBase,
    unidadBase,
    className = "",
    showTooltip = true
}) => {
    if (!desglose || desglose.length === 0) {
        return null;
    }

    // Formatear el desglose para mostrar
    const formatearDesglose = () => {
        return desglose
            .map(item => `${item.cantidad} ${item.nombre.toLowerCase()}`)
            .join(', ');
    };

    // Formatear el desglose compacto para mostrar
    const formatearDesgloseCompacto = () => {
        return desglose
            .map(item => `${item.cantidad} ${item.abreviatura}`)
            .join(', ');
    };

    const tooltipText = showTooltip ? 
        `Stock base: ${stockBase} ${unidadBase.abreviatura} = ${formatearDesglose()}` : 
        undefined;

    return (
        <div 
            className={`text-xs text-gray-600 dark:text-gray-300 ${className}`}
            title={tooltipText}
        >
            <span className="font-medium">
                {formatearDesgloseCompacto()}
            </span>
        </div>
    );
};

export default StockDesglosado;