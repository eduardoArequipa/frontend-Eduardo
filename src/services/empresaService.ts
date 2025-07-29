// src/services/empresaService.ts
import axiosInstance from '../api/axiosInstance';
import { Empresa } from '../types/empresa';
import { EstadoEnum } from '../types/enums';
export interface GetEmpresasParams {
    estado?: EstadoEnum;
    search?: string; 
    skip?: number; 
    limit?: number; 
    without_proveedor?: boolean; 
}

export const getEmpresas = async (params?: GetEmpresasParams): Promise<Empresa[]> => {
    const response = await axiosInstance.get('/empresas/', { params });
    return response.data;
};
export const getEmpresaById = async (id: number): Promise<Empresa> => {
    const response = await axiosInstance.get(`/empresas/${id}`);
    return response.data;
};
