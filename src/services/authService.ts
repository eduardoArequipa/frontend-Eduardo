// src/services/authService.ts
import axiosInstance from '../api/axiosInstance';
import { Token } from '../types/auth';
import { IUsuarioInDB } from '../types/usuario'; 
import { IMenuInDB, IMenuWithRoles } from '../types/menu'; // Importar el tipo de Menú

export interface ForgotPasswordRequestPayload {
    username_or_email: string;
}

export interface ResetPasswordRequestPayload {
    username_or_email: string;
    recovery_code: string;
    new_password: string;
}
export const login = async (username: string, password: string): Promise<Token> => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await axiosInstance.post('/auth/login', formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
    return response.data;
};

export const getMe = async (): Promise<IUsuarioInDB> => {
    const response = await axiosInstance.get('/auth/me');
    return response.data; 
};

/**
 * Obtiene los menús permitidos para el usuario actualmente autenticado.
 * @returns Una promesa que resuelve en un array de IMenuInDB.
 */
export const getMeMenus = async (): Promise<IMenuInDB[]> => {
    const response = await axiosInstance.get('/auth/me/menus');

    return response.data;
};

/**
 * Obtiene los menús con información de roles para filtrado dinámico.
 * @returns Una promesa que resuelve en un array de IMenuWithRoles.
 */
export const getMeMenusWithRoles = async (): Promise<IMenuWithRoles[]> => {
    const response = await axiosInstance.get('/auth/me/menus-with-roles');

    return response.data;
};

export const requestPasswordReset = async (payload: ForgotPasswordRequestPayload): Promise<{ message: string }> => {
    const response = await axiosInstance.post('/auth/forgot-password-request', payload);
    return response.data;
};

export const resetPassword = async (payload: ResetPasswordRequestPayload): Promise<{ message: string }> => {
    const response = await axiosInstance.post('/auth/reset-password', payload);
    return response.data;
};