// src/services/proveedorService.ts

import axiosInstance from '../api/axiosInstance';
import {
    Proveedor, // Esquema de lectura
    ProveedorCreate, // Esquema para creación (con opciones anidadas)
    ProveedorUpdate, // Esquema para actualización (con datos anidados opcionales)
    GetProveedoresParams, // Interfaz para los parámetros de consulta del listado
    ProveedorPagination // Importar ProveedorPagination
} from '../types/proveedor';

export const getProveedores = async (params?: GetProveedoresParams): Promise<ProveedorPagination> => { // Cambiado el tipo de retorno
    const response = await axiosInstance.get('/proveedores/', { params });
    return response.data;
};

export const getProveedorById = async (id: number): Promise<Proveedor> => {
    const response = await axiosInstance.get(`/proveedores/${id}`);
    return response.data;
};
export const createProveedor = async (proveedorData: ProveedorCreate): Promise<Proveedor> => {
    const response = await axiosInstance.post('/proveedores/', proveedorData);
    return response.data;
};

export const updateProveedor = async (id: number, proveedorData: ProveedorUpdate): Promise<Proveedor> => {
    const response = await axiosInstance.put(`/proveedores/${id}`, proveedorData);
    return response.data;
};

export const deleteProveedor = async (id: number): Promise<void> => {
    await axiosInstance.delete(`/proveedores/${id}`);
};
export const activateProveedor = async (id: number): Promise<Proveedor> => {
    const response = await axiosInstance.patch(`/proveedores/${id}`);
     return response.data;
};