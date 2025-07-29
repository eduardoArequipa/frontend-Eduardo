
import axiosInstance from '../api/axiosInstance';

import {
    Compra, // Esquema de lectura completa
    CompraCreate, // Esquema para creación
    CompraUpdate, // Esquema para actualización
    GetComprasParams // Interfaz para los parámetros de consulta del listado
} from '../types/compra';


export const getCompras = async (params?: GetComprasParams): Promise<Compra[]> => {

    const response = await axiosInstance.get('/compras/', { params });
    return response.data;
};

export const getCompraById = async (id: number): Promise<Compra> => {
    const response = await axiosInstance.get(`/compras/${id}`);
    return response.data;
};


export const createCompra = async (compraData: CompraCreate): Promise<Compra> => {

    const response = await axiosInstance.post('/compras/', compraData);
    return response.data;
};


export const updateCompra = async (id: number, compraData: CompraUpdate): Promise<Compra> => {

    const response = await axiosInstance.put(`/compras/${id}`, compraData);
    return response.data;
};


export const anularCompra = async (id: number): Promise<Compra> => {

    const response = await axiosInstance.patch(`/compras/${id}/anular`);
     return response.data; // Retorna el objeto Compra actualizado (con estado 'anulada')
};


export const completarCompra = async (id: number): Promise<Compra> => {

    const response = await axiosInstance.patch(`/compras/${id}/completar`);
     return response.data; // Retorna el objeto Compra actualizado (con estado 'completada')
};


