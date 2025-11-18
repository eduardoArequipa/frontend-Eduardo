import { Producto } from '../types/producto';
import Decimal from 'decimal.js';

/**
 * Calcula el desglose del stock en sus diferentes presentaciones.
 * @param totalStock El stock total en la unidad base.
 * @param producto El objeto del producto con sus conversiones y unidad de inventario.
 * @returns Un string formateado con el desglose, ej: "6 cajas, 4 rollos, 2 un."
 */
export const formatStockBreakdown = (totalStock: number | string, producto: Producto): string => {
    if (totalStock === null || totalStock === undefined) {
        return 'N/A';
    }

    let remainingStock = new Decimal(totalStock);
    if (remainingStock.isNaN()) {
        return 'Inválido';
    }

    const parts: string[] = [];

    // 1. Ordenar las conversiones de la más grande a la más pequeña
    const sortedConversions = [...producto.conversiones].sort((a, b) => 
        new Decimal(b.unidades_por_presentacion).cmp(new Decimal(a.unidades_por_presentacion))
    );

    // 2. Iterar sobre las conversiones para calcular las cantidades enteras
    for (const conv of sortedConversions) {
        const unitsPerPres = new Decimal(conv.unidades_por_presentacion);
        if (unitsPerPres.isZero() || unitsPerPres.isNaN()) continue;

        if (remainingStock.gte(unitsPerPres)) {
            const count = remainingStock.divToInt(unitsPerPres);
            if (count.gt(0)) {
                parts.push(`${count.toString()} ${conv.nombre_presentacion}(s)`);
                remainingStock = remainingStock.mod(unitsPerPres);
            }
        }
    }

    // 3. Manejar el remanente en la unidad base
    if (remainingStock.gt(0)) {
        const isFraccionable = producto.unidad_inventario.nombre_unidad.toLowerCase() !== 'unidad';
        
        let finalAmountStr: string;
        if (isFraccionable) {
            // Redondear a un número razonable de decimales si es fraccionable
            finalAmountStr = remainingStock.toDecimalPlaces(2, Decimal.ROUND_DOWN).toString();
        } else {
            // Si no es fraccionable, debería ser un entero, pero por si acaso, lo truncamos.
            finalAmountStr = remainingStock.floor().toString();
        }

        // Solo añadir si el valor es significativo
        if (parseFloat(finalAmountStr) > 0) {
             parts.push(`${finalAmountStr} ${producto.unidad_inventario.abreviatura}`);
        }
    }

    // 4. Unir las partes
    if (parts.length > 0) {
        return parts.join(', ');
    }

    // Si después de todos los cálculos el stock es 0
    return `0 ${producto.unidad_inventario.abreviatura}`;
};
