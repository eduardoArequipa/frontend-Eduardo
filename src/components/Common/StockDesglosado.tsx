import React from 'react';
import { DesglosePresentacion } from '../../types/producto';
import { formatearPresentacion, formatearPresentacionCompacta } from '../../utils/pluralization';

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

    // Formatear el desglose para mostrar con pluralización correcta
    const formatearDesglose = () => {
        return desglose
            .map(item => formatearPresentacion(item.cantidad, item.nombre))
            .join(', ');
    };

    // Formatear el desglose compacto para mostrar
    const formatearDesgloseCompacto = () => {
        return desglose
            .map(item => formatearPresentacionCompacta(item.cantidad, item.nombre, item.abreviatura))
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