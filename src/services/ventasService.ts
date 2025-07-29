// src/services/ventasService.ts

import axiosInstance from '../api/axiosInstance';
import {
    VentaCreate,          // Usar la interfaz con 'I'
    Venta,    // Usar la interfaz con 'I'
} from '../types/venta';
import { ProductoSchemaBase } from '../types/producto'; // Se mantiene sin 'I' según tu aclaración
import { MetodoPagoNested } from '../types/metodoPago'; // Asumiendo que ahora es IMetodoPagoNested
// Importa IPersonaNested en lugar de Cliente
import { EstadoEnum, EstadoVentaEnum } from '../types/enums';

/**
 * Define los filtros para la obtención de ventas.
 * Se reemplaza 'cliente_id' por 'persona_id'.
 */
interface IGetVentasFilters {
    estado?: EstadoVentaEnum;
    persona_id?: number; // <-- ¡CAMBIO CLAVE AQUÍ!
    metodo_pago_id?: number;
    fecha_desde?: string; // Formato 'YYYY-MM-DD' o 'YYYY-MM-DDTHH:MM:SS'
    fecha_hasta?: string; // Formato 'YYYY-MM-DD' o 'YYYY-MM-DDTHH:MM:SS'
    search?: string;
    skip?: number;
    limit?: number;
}

/**
 * Busca un producto por su código único.
 * @param codigo El código del producto.
 * @returns Una promesa que resuelve en un ProductoSchemaBase.
 */
export const getProductoByCodigo = async (codigo: string): Promise<ProductoSchemaBase> => {
    try {
        const response = await axiosInstance.get<ProductoSchemaBase>(`/productos/buscar_por_codigo/${codigo}`);
        return response.data;
    } catch (error) {
        console.error('Error al buscar producto por código:', error);
        throw error;
    }
};

/**
 * Crea una nueva venta en el backend.
 * @param ventaData Los datos de la venta a crear (incluye persona_id).
 * @returns Una promesa que resuelve en la IVenta creada.
 */
export const createVenta = async (ventaData: VentaCreate): Promise<Venta> => { // Usar IVentaCreate y IVenta
    try {
        const response = await axiosInstance.post<Venta>('/ventas/', ventaData);
        return response.data;
    } catch (error) {
        console.error('Error al crear venta:', error);
        throw error;
    }
};

/**
 * Obtiene una lista de productos activos y con stock para ser usados en ventas.
 * @returns Una promesa que resuelve en un array de ProductoSchemaBase.
 */
export const getProductosParaVenta = async (p0: { limit: number; estado: EstadoEnum; }): Promise<ProductoSchemaBase[]> => {
    try {
        const response = await axiosInstance.get<ProductoSchemaBase[]>('/productos/', {
            params: {
                estado: 'activo', // Filtra por productos activos
                min_stock: 1     // Filtra por productos con al menos 1 unidad en stock
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error al obtener productos para venta:', error);
        throw error;
    }
};

/**
 * Obtiene una lista de ventas con opciones de filtrado.
 * @param filters Filtros opcionales para la búsqueda de ventas.
 * @returns Una promesa que resuelve en un array de IVenta.
 */
export const getVentas = async (filters: IGetVentasFilters = {}): Promise<Venta[]> => { // Usar IGetVentasFilters y IVenta
    try {
        const params = new URLSearchParams();
        for (const key in filters) {
            const value = filters[key as keyof IGetVentasFilters];
            // Asegúrate de que el backend espera 'persona_id' y no 'cliente_id'
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, String(value));
            }
        }
        const response = await axiosInstance.get<Venta[]>(`/ventas/?${params.toString()}`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener ventas:', error);
        throw error;
    }
};

/**
 * Obtiene los detalles de una venta específica por su ID.
 * @param id El ID de la venta.
 * @returns Una promesa que resuelve en una IVenta.
 */
export const getVentaById = async (id: number): Promise<Venta> => { // Usar IVenta
    try {
        const response = await axiosInstance.get<Venta>(`/ventas/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error al obtener venta con ID ${id}:`, error);
        throw error;
    }
};

/**
 * Anula una venta existente por su ID.
 * @param id El ID de la venta a anular.
 * @returns Una promesa que resuelve en la IVenta anulada.
 */
export const anularVenta = async (id: number): Promise<Venta> => { // Usar IVenta
    try {
        const response = await axiosInstance.patch<Venta>(`/ventas/${id}/anular`);
        return response.data;
    } catch (error) {
        console.error(`Error al anular venta con ID ${id}:`, error);
        throw error;
    }
};

/**
 * Obtiene una lista de métodos de pago.
 * @returns Una promesa que resuelve en un array de IMetodoPagoNested.
 */
export const getMetodosPago = async (): Promise<MetodoPagoNested[]> => { // Usar IMetodoPagoNested
    try {
        const response = await axiosInstance.get<MetodoPagoNested[]>('/metodos_pago/');
        return response.data;
    } catch (error) {
        console.error('Error al obtener métodos de pago:', error);
        throw error;
    }
};

// Esta función ya no es necesaria y debe ser eliminada,
// ya que 'Cliente' fue reemplazado por 'Persona'.
// export const getClientes = async (): Promise<Cliente[]> => {
//     try {
//         const response = await axiosInstance.get<Cliente[]>('/clientes/');
//         return response.data;
//     } catch (error) {
//         console.error('Error al obtener clientes:', error);
//         throw error;
//     }
// };