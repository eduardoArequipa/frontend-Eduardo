// src/services/rolService.ts

import axiosInstance from '../api/axiosInstance';
import { IRolInDB } from '../types/rol';
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
    console.log("[DEBUG FRONTEND - rolService] Respuesta cruda de getRoleById:", response.data);
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
