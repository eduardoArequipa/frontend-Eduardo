// src/services/categoriaService.ts
import axiosInstance from '../api/axiosInstance';
import { Categoria, CategoriaCreate, CategoriaUpdate, CategoriaPagination } from '../types/categoria'; // Importar CategoriaPagination
import { EstadoEnum } from '../types/enums';
export interface GetCategoriasParams { 
    estado?: EstadoEnum;
    search?: string; 
    skip?: number; 
    limit?: number; 
}
export const getCategorias = async (params?: GetCategoriasParams): Promise<CategoriaPagination> => { // Cambiado el tipo de retorno
    const response = await axiosInstance.get('/categorias/', { params });
    return response.data;
};

export const getCategoriaById = async (id: number): Promise<Categoria> => {
    const response = await axiosInstance.get(`/categorias/${id}`);
    return response.data;
};

export const createCategoria = async (categoriaData: CategoriaCreate): Promise<Categoria> => {
    const response = await axiosInstance.post('/categorias/', categoriaData);
    return response.data;
};

export const updateCategoria = async (id: number, categoriaData: CategoriaUpdate): Promise<Categoria> => {
 const response = await axiosInstance.put(`/categorias/${id}`, categoriaData);
    return response.data;
};
export const activateCategoria = async (id: number): Promise<void> => {
 await axiosInstance.patch(`/categorias/${id}/activar`);
};

export const deleteCategoria = async (id: number): Promise<void> => {
    await axiosInstance.delete(`/categorias/${id}`);
};