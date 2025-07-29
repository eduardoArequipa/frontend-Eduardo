// src/services/unidadMedidaService.ts
import axiosInstance from '../api/axiosInstance'; 
import { UnidadMedida, UnidadMedidaCreate } from '../types/unidad_medida';
import { EstadoEnum } from '../types/enums'; 
interface GetUnidadesMedidaParams {
    estado?: EstadoEnum; 
    search?: string;
    skip?: number;
    limit?: number;
}

export const getUnidadesMedida = async (params?: GetUnidadesMedidaParams): Promise<UnidadMedida[]> => {
    const response = await axiosInstance.get('/unidades-medida/', { params });
    return response.data;
};

export const getUnidadMedidaById = async (id: number): Promise<UnidadMedida> => {
    const response = await axiosInstance.get(`/unidades-medida/${id}`);
    return response.data;
};

export const createUnidadMedida = async (unidadData: UnidadMedidaCreate): Promise<UnidadMedida> => {
    const response = await axiosInstance.post('/unidades-medida/', unidadData);
    return response.data;
};

export const deleteUnidadMedida = async (id: number): Promise<void> => {
    await axiosInstance.delete(`/unidades-medida/${id}`);
};
