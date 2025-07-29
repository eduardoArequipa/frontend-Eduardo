// src/services/userService.ts

import axiosInstance from '../api/axiosInstance';
import { IUsuarioReadAudit, IUsuarioCreate, IUsuarioUpdate } from '../types/usuario';
import { EstadoEnum } from '../types/enums';

interface IGetUsersParams {
    estado?: EstadoEnum;
    search?: string;
    rol_id?: number;
    persona_id?: number;
    skip?: number;
    limit?: number;
}


export const getUsers = async (params?: IGetUsersParams): Promise<IUsuarioReadAudit[]> => {
    const response = await axiosInstance.get('/usuarios/', { params });
    return response.data;
};


export const getUserById = async (id: number): Promise<IUsuarioReadAudit> => {
    const response = await axiosInstance.get(`/usuarios/${id}`);
    return response.data;
};


export const createUser = async (userData: IUsuarioCreate): Promise<IUsuarioReadAudit> => {
    const response = await axiosInstance.post('/usuarios/', userData);
    return response.data;
};


export const updateUser = async (id: number, userData: IUsuarioUpdate): Promise<IUsuarioReadAudit> => {

    const response = await axiosInstance.put(`/usuarios/${id}`, userData); // Cambiado a PATCH
    return response.data;
};


export const deactivateUser = async (id: number): Promise<void> => {
    await axiosInstance.delete(`/usuarios/${id}`);
};


export const activarUsuario = async (id: number): Promise<void> => {
    await axiosInstance.patch(`/usuarios/${id}/activar`); // Asumiendo este endpoint específico para activar
};

export const assignRoleToUser = async (userId: number, roleId: number): Promise<IUsuarioReadAudit> => {
    const response = await axiosInstance.post(`/usuarios/${userId}/roles/${roleId}`);
    return response.data;
};


export const removeRoleFromUser = async (userId: number, roleId: number): Promise<IUsuarioReadAudit> => {
    const response = await axiosInstance.delete(`/usuarios/${userId}/roles/${roleId}`);
    return response.data;
};