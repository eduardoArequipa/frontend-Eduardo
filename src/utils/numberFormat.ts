// src/utils/numberFormat.ts

/**
 * Formatea números para mostrar cantidades de forma consistente
 * Evita el problema de localización donde 1 se muestra como 1.000
 */

/**
 * Formatea una cantidad (stock, unidades) sin separadores de miles confusos
 */
export const formatearCantidad = (cantidad: number | string): string => {
    const num = typeof cantidad === 'string' ? parseFloat(cantidad) : cantidad;

    if (isNaN(num)) return '0';

    // Si es número entero, mostrarlo sin decimales
    if (Number.isInteger(num)) {
        return num.toString();
    }

    // Si tiene decimales, mostrar hasta 2 decimales y quitar ceros al final
    return num.toFixed(2).replace(/\.?0+$/, '');
};

/**
 * Formatea precios en bolivianos con 2 decimales
 */
export const formatearPrecio = (precio: number | string): string => {
    const num = typeof precio === 'string' ? parseFloat(precio) : precio;

    if (isNaN(num)) return '0.00';

    return num.toFixed(2);
};

/**
 * Formatea montos grandes con separadores para mayor legibilidad
 * Usa espacio como separador de miles para evitar confusión
 */
export const formatearMonto = (monto: number | string): string => {
    const num = typeof monto === 'string' ? parseFloat(monto) : monto;

    if (isNaN(num)) return '0.00';

    // Usar espacio como separador de miles para mayor claridad
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

/**
 * Formatea porcentajes
 */
export const formatearPorcentaje = (porcentaje: number | string, decimales: number = 1): string => {
    const num = typeof porcentaje === 'string' ? parseFloat(porcentaje) : porcentaje;

    if (isNaN(num)) return '0%';

    return `${num.toFixed(decimales)}%`;
};