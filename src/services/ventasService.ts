import axiosInstance from '../api/axiosInstance';
import { Venta, VentaCreate, VentaPagination } from '../types/venta';
import { Producto, ProductoPagination } from '../types/producto'; // Importar ProductoPagination
import { MetodoPagoNested } from '../types/metodoPago';
import { EstadoEnum, EstadoVentaEnum } from '../types/enums';


interface IGetVentasFilters {
    estado?: EstadoVentaEnum;
    persona_id?: number;
    metodo_pago_id?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
    search?: string;
    skip?: number; // Añadido para paginación
    limit?: number; // Añadido para paginación
}

/**
 * Busca un producto por su código único.
 * @param codigo El código del producto.
 * @returns Una promesa que resuelve en un ProductoSchemaBase.
 */
export const getProductoByCodigo = async (codigo: string): Promise<Producto> => {
    try {
        const response = await axiosInstance.get<Producto>(`/productos/buscar_por_codigo/${codigo}`);
        return response.data;
    } catch (error) {
        console.error('Error al buscar producto por código:', error);
        throw error;
    }
};

/**
 * Crea una nueva venta en el backend.
 * @param ventaData Los datos de la venta a crear (incluye persona_id).
 * @returns Una promesa que resuelve en la Venta creada.
 */
export const createVenta = async (ventaData: VentaCreate): Promise<Venta> => {
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
 * @returns Una promesa que resuelve en un objeto ProductoPagination.
 */
export const getProductosParaVenta = async (): Promise<ProductoPagination> => {
    try {
        const response = await axiosInstance.get<ProductoPagination>('/productos/', {
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
 * @returns Una promesa que resuelve en un objeto VentaPagination.
 */
export const getVentas = async (filters: IGetVentasFilters = {}): Promise<VentaPagination> => {
    try {
        const params = new URLSearchParams();
        for (const key in filters) {
            const value = filters[key as keyof IGetVentasFilters];
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, String(value));
            }
        }
        const response = await axiosInstance.get<VentaPagination>(`/ventas/?${params.toString()}`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener ventas:', error);
        throw error;
    }
};

/**
 * Obtiene los detalles de una venta específica por su ID.
 * @param id El ID de la venta.
 * @returns Una promesa que resuelve en una Venta.
 */
export const getVentaById = async (id: number): Promise<Venta> => {
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
 * @returns Una promesa que resuelve en la Venta anulada.
 */
export const anularVenta = async (id: number): Promise<Venta> => {
    try {
        const response = await axiosInstance.patch<Venta>(`/ventas/${id}/anular`);
        return response.data;
    } catch (error) {
        console.error(`Error al anular venta con ID ${id}:`, error);
        throw error;
    }
};

/**
 * Anula una factura electrónica específica.
 * @param facturaId El ID de la factura a anular.
 * @param codigoMotivo Código del motivo de anulación (por defecto 1 = error de importe).
 * @returns Una promesa que resuelve en el resultado de la anulación.
 */
export const anularFactura = async (facturaId: number, codigoMotivo: number = 1): Promise<{ success: boolean; message: string; codigo_recepcion?: string }> => {
    try {
        const response = await axiosInstance.patch(`/facturas/${facturaId}/anular`, {
            codigo_motivo: codigoMotivo
        });
        return response.data;
    } catch (error) {
        console.error(`Error al anular factura con ID ${facturaId}:`, error);
        throw error;
    }
};

/**
 * Obtiene una lista de métodos de pago.
 * @returns Una promesa que resuelve en un array de MetodoPagoNested.
 */
export const getMetodosPago = async (params?: { estado?: EstadoEnum }): Promise<MetodoPagoNested[]> => {
    try {
        const response = await axiosInstance.get<MetodoPagoNested[]>('/metodos_pago/', { params });
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

/**
 * Descarga la representación PDF de una factura electrónica desde el backend.
 * @param facturaId El ID de la factura a descargar.
 */
export const descargarFacturaPdf = async (facturaId: number): Promise<void> => {
    try {
        const response = await axiosInstance.get(`/facturas/${facturaId}/pdf`, {
            responseType: 'blob', // Importante para manejar archivos binarios
        });

        // Crear una URL para el blob
        const url = window.URL.createObjectURL(new Blob([response.data]));
        
        // Crear un enlace temporal para iniciar la descarga
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `factura-${facturaId}.pdf`);
        document.body.appendChild(link);
        link.click();

        // Limpiar
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

    } catch (error: any) {
        console.error('Error al descargar la factura PDF:', error);
        // Intentar leer el error del blob si es posible
        if (error.response && error.response.data) {
            const errorBlob = error.response.data as Blob;
            const errorText = await errorBlob.text();
            try {
                const errorJson = JSON.parse(errorText);
                throw new Error(errorJson.detail || 'Ocurrió un error al descargar la factura.');
            } catch (e) {
                throw new Error('Ocurrió un error al descargar la factura y la respuesta de error no pudo ser procesada.');
            }
        }
        throw new Error('Ocurrió un error al descargar la factura.');
    }
};
