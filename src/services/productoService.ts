// src/services/productoService.ts
import axiosInstance from '../api/axiosInstance';
import { Producto, ProductoCreate, ProductoUpdate, ProductoPagination,  Conversion,  ConversionCreate, PrecioSugeridoRequest, PrecioSugeridoResponse } from '../types/producto';
import { EstadoEnum } from '../types/enums';

export interface GetProductosParams {
    estado?: EstadoEnum;
    search?: string; 
    categoria?: number; // Para el frontend será 'categoria'
    unidad_inventario?: number; // Para el frontend será 'unidad_inventario'
    marca?: number; // Para el frontend será 'marca'
    min_stock?: number; 
    skip?: number;
    limit?: number;
}

export const getProductos = async (params?: GetProductosParams): Promise<ProductoPagination> => {
    const response = await axiosInstance.get('/productos/', { params });
    return response.data;
};


export const searchProductSuggestions = async (query: string): Promise<Producto[]> => {
    const response = await axiosInstance.get('/productos/search/suggestions', {
        params: { q: query }
    });
    return response.data;
};

export const getConversiones = async (params?: { skip?: number; limit?: number }): Promise<Conversion[]> => {
    const response = await axiosInstance.get('/productos/conversiones/', { params });
    return response.data;
};



// --- Nuevos servicios para Conversiones ---

export const createConversion = async (productoId: number, conversionData: ConversionCreate): Promise<Conversion> => {
    const response = await axiosInstance.post(`/productos/conversiones/?producto_id=${productoId}`, conversionData);
    return response.data;
};

export const updateConversion = async (conversionId: number, conversionData: ConversionCreate): Promise<Conversion> => {
    const response = await axiosInstance.put(`/productos/conversiones/${conversionId}`, conversionData);
    return response.data;
};

export const deleteConversion = async (conversionId: number): Promise<void> => {
    await axiosInstance.delete(`/productos/conversiones/${conversionId}`);
};


export const getProductoById = async (id: number): Promise<Producto> => {
    const response = await axiosInstance.get(`/productos/${id}`);
    return response.data;
};

export const createProducto = async (productoData: ProductoCreate): Promise<Producto> => {
    const response = await axiosInstance.post('/productos/', productoData);
    return response.data;
};

export const updateProducto = async (id: number, productoData: ProductoUpdate): Promise<Producto> => {
    const response = await axiosInstance.put(`/productos/${id}`, productoData);
    return response.data;
};

export const deleteProducto = async (id: number): Promise<void> => {
    await axiosInstance.patch(`/productos/${id}/inactivar`);
};

export const activateProducto = async (id: number): Promise<Producto> => {
    const response = await axiosInstance.patch(`/productos/${id}/activar`);
    return response.data;
};

export const getProductoByCode = async (codigo: string): Promise<Producto> => {
    const response = await axiosInstance.get(`/productos/by-code/${codigo}`);
    return response.data;
};

export const getLowStockProducts = async (): Promise<Producto[]> => {
    try {
        const response = await axiosInstance.get('/productos/low-stock'); 
        return response.data;
    } catch (error) {
        console.error('Error fetching low stock products:', error);
        throw error;
    }
};

// Servicio para calcular precio sugerido
export const calcularPrecioSugerido = async (request: PrecioSugeridoRequest): Promise<PrecioSugeridoResponse> => {
    try {
        const response = await axiosInstance.post('/productos/calcular-precio-sugerido', request);
        return response.data;
    } catch (error) {
        console.error('Error calculando precio sugerido:', error);
        throw error;
    }
};

export const checkFieldUniqueness = async (field_name: 'codigo' | 'nombre', value: string, producto_id?: number): Promise<{ is_unique: boolean }> => {
    const params: { field_name: string; value: string; producto_id?: number } = {
        field_name,
        value,
    };
    if (producto_id !== undefined) {
        params.producto_id = producto_id;
    }
    const response = await axiosInstance.get('/productos/check-field', { params });
    return response.data;
};