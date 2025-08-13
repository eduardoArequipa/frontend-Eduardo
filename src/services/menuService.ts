// src/services/menuService.ts

import axiosInstance from '../api/axiosInstance';
import { IMenuInDB } from '../types/menu';

/**
 * Obtiene una lista de todos los menús/módulos del sistema.
 * @returns Una promesa que resuelve en un array de IMenuInDB.
 */
export const getAllMenus = async (): Promise<IMenuInDB[]> => {
    const response = await axiosInstance.get('/menus/');
    return response.data;
};
