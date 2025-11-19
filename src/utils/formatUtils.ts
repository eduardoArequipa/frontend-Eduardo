// frontEnd/src/utils/formatUtils.ts
import { Conversion } from '../types/producto';

export const formatStockDisplay = (stock: number, conversiones: Conversion[], unidadBase: string): string => {
    if (isNaN(stock)) return `0 ${unidadBase}(s)`;
    const sortedConversions = [...conversiones].sort((a, b) => Number(b.unidades_por_presentacion) - Number(a.unidades_por_presentacion));
    let remainingStock = stock;
    const parts: string[] = [];

    for (const conv of sortedConversions) {
        const unidades = Number(conv.unidades_por_presentacion);
        if (unidades <= 0) continue;
        const count = Math.floor(remainingStock / unidades);
        if (count > 0) {
            parts.push(`${count} ${conv.nombre_presentacion}(s)`);
            remainingStock %= unidades;
        }
    }

    const finalRemainingStock = parseFloat(remainingStock.toFixed(2));
    if (finalRemainingStock > 0) {
        parts.push(`${finalRemainingStock} ${unidadBase}(s)`);
    }

    if (parts.length === 0) return `0 ${unidadBase}(s)`;
    return parts.join(' y ');
};
