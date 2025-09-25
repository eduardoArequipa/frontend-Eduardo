// src/utils/validacionCantidad.ts
import { Producto } from '../types/producto';

/**
 * Valida la cantidad de venta basada en la unidad de inventario del producto
 * @param cantidad - Cantidad a validar
 * @param producto - Producto con su unidad de inventario
 * @returns true si la cantidad es válida, false si no
 */
export const validarCantidadVenta = (cantidad: number, producto: Producto): boolean => {
    // Verificar que la cantidad sea positiva
    if (cantidad <= 0) {
        return false;
    }

    // Si la unidad de inventario permite fracciones, cualquier decimal positivo es válido
    if (producto.unidad_inventario.es_fraccionable) {
        return true; // Permite 0.5, 1.25, 2.75 metros, litros, kg, etc.
    }

    // Si la unidad NO permite fracciones, solo permite enteros
    return Number.isInteger(cantidad); // Solo 1, 2, 3 piezas, cajas, rollos, etc.
};

/**
 * Obtiene el mensaje de error apropiado para una cantidad inválida
 * @param cantidad - Cantidad que falló la validación
 * @param producto - Producto con su unidad de inventario
 * @returns Mensaje de error descriptivo
 */
export const obtenerMensajeErrorCantidad = (cantidad: number, producto: Producto): string => {
    if (cantidad <= 0) {
        return "La cantidad debe ser mayor a cero";
    }

    if (!producto.unidad_inventario.es_fraccionable && !Number.isInteger(cantidad)) {
        return `Esta unidad (${producto.unidad_inventario.nombre_unidad}) requiere cantidades enteras (ej: 1, 2, 3)`;
    }

    return "Cantidad inválida";
};

/**
 * Formatea la cantidad según las reglas de la unidad de medida
 * @param cantidad - Cantidad a formatear
 * @param producto - Producto con su unidad de inventario
 * @returns Cantidad formateada como string
 */
export const formatearCantidad = (cantidad: number, producto: Producto): string => {
    if (producto.unidad_inventario.es_fraccionable) {
        // Para unidades fraccionables, mostrar hasta 2 decimales
        return cantidad.toFixed(2).replace(/\.?0+$/, '');
    } else {
        // Para unidades enteras, mostrar sin decimales
        return Math.floor(cantidad).toString();
    }
};

/**
 * Obtiene el placeholder apropiado para el input de cantidad
 * @param producto - Producto con su unidad de inventario
 * @returns Placeholder para el input
 */
export const obtenerPlaceholderCantidad = (producto: Producto): string => {
    if (producto.unidad_inventario.es_fraccionable) {
        return `Ej: 1.5 ${producto.unidad_inventario.abreviatura}`;
    } else {
        return `Ej: 2 ${producto.unidad_inventario.abreviatura}`;
    }
};