// src/services/rolService.ts

import axiosInstance from '../api/axiosInstance';
import { IRolInDB, IRolCreate, IRolUpdate } from '../types/rol';
import { EstadoEnum } from '../types/enums';
import { IMenuInDB } from '../types/menu';

/**
 * Define los parámetros de consulta para la obtención de roles.
 */
interface IGetRolesParams {
    estado?: EstadoEnum;
    search?: string;
}

/**
 * Obtiene una lista de roles del backend con opciones de filtrado.
 * @param params Parámetros de consulta opcionales.
 * @returns Una promesa que resuelve en un array de IRolInDB.
 */
export const getRoles = async (params?: IGetRolesParams): Promise<IRolInDB[]> => {
    const response = await axiosInstance.get('/roles/', { params });
    return response.data;
};

/**
 * Obtiene los detalles de un rol específico por su ID.
 * @param id El ID del rol.
 * @returns Una promesa que resuelve en un IRolInDB.
 */
export const getRoleById = async (id: number): Promise<IRolInDB> => {
    const response = await axiosInstance.get(`/roles/${id}`);
    return response.data;
};

/**
 * Obtiene los menús asignados a un rol específico.
 * @param roleId El ID del rol.
 * @returns Una promesa que resuelve en un array de IMenuInDB.
 */
export const getMenusForRole = async (roleId: number): Promise<IMenuInDB[]> => {
    const response = await axiosInstance.get(`/roles/${roleId}/menus`);
    return response.data;
};

/**
 * Actualiza los menús (permisos) para un rol específico.
 * @param roleId El ID del rol a actualizar.
 * @param menuIds Un array con los IDs de los menús a asignar.
 * @returns Una promesa que resuelve en el IRolInDB actualizado.
 */
export const updateMenusForRole = async (roleId: number, menuIds: number[]): Promise<void> => {
    await axiosInstance.put(`/roles/${roleId}/menus`, { menu_ids: menuIds });
};

/**
 * Crea un nuevo rol.
 * @param rolData Los datos del rol a crear.
 * @returns Una promesa que resuelve en el IRolInDB creado.
 */
export const createRol = async (rolData: IRolCreate): Promise<IRolInDB> => {
    const response = await axiosInstance.post('/roles/', rolData);
    return response.data;
};

/**
 * Actualiza un rol existente.
 * @param roleId El ID del rol a actualizar.
 * @param rolData Los datos del rol a actualizar.
 * @returns Una promesa que resuelve en el IRolInDB actualizado.
 */
export const updateRol = async (roleId: number, rolData: IRolUpdate): Promise<IRolInDB> => {
    const response = await axiosInstance.put(`/roles/${roleId}`, rolData);
    return response.data;
};

/**
 * Elimina un rol por su ID.
 * @param roleId El ID del rol a eliminar.
 * @returns Una promesa que resuelve cuando el rol es eliminado.
 */
export const deleteRol = async (roleId: number): Promise<void> => {
    await axiosInstance.delete(`/roles/${roleId}`);
};
