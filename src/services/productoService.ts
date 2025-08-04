// src/services/productoService.ts
import axiosInstance from '../api/axiosInstance';
import { Producto, ProductoCreate, ProductoUpdate, ProductoPagination } from '../types/producto'; // Importar ProductoPagination
import { EstadoEnum } from '../types/enums';

export interface GetProductosParams {
    estado?: EstadoEnum;
    search?: string; 
    categoria_id?: number; 
    unidad_medida_id?: number; 
    marca_id?: number; 
    min_stock?: number; 
    skip?: number; // Añadido para paginación
    limit?: number; // Añadido para paginación
}

export const getProductos = async (params?: GetProductosParams): Promise<ProductoPagination> => { // Cambiado el tipo de retorno
    const response = await axiosInstance.get('/productos/', { params });
    return response.data;
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