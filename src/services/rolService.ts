// src/services/roleService.ts

import axiosInstance from '../api/axiosInstance';
// Importa las interfaces con el prefijo 'I'
import { IRolInDB, IRolCreate, IRolUpdate } from '../types/rol';
import { EstadoEnum } from '../types/enums';

/**
 * Define los parámetros de consulta para la obtención de roles.
 */
interface IGetRolesParams {
    estado?: EstadoEnum;
    search?: string;
    skip?: number;
    limit?: number;
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
 * Crea un nuevo rol en el backend.
 * @param roleData Los datos del rol a crear.
 * @returns Una promesa que resuelve en el IRolInDB creado.
 */
export const createRole = async (roleData: IRolCreate): Promise<IRolInDB> => {
    const response = await axiosInstance.post('/roles/', roleData);
    return response.data;
};

/**
 * Actualiza un rol existente en el backend por su ID.
 * @param id El ID del rol a actualizar.
 * @param roleData Los datos del rol a actualizar (parcial o completo).
 * @returns Una promesa que resuelve en el IRolInDB actualizado.
 */
export const updateRole = async (id: number, roleData: IRolUpdate): Promise<IRolInDB> => {
    // Si IRolUpdate es Partial, como lo definimos, entonces un PATCH sería más apropiado.
    // Si tu backend espera PUT para actualizaciones parciales, mantén PUT.
    const response = await axiosInstance.patch(`/roles/${id}`, roleData); // Cambiado a PATCH
    return response.data;
};

/**
 * Elimina un rol en el backend por su ID.
 * Nota: Si 'eliminar' significa cambiar el estado a inactivo,
 * considera un PATCH a /roles/{id} con { estado: EstadoEnum.inactivo }
 * o un endpoint específico como /roles/{id}/desactivar.
 * @param id El ID del rol a eliminar.
 * @returns Una promesa vacía.
 */
export const deleteRole = async (id: number): Promise<void> => {
    await axiosInstance.delete(`/roles/${id}`);
};