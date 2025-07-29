// src/services/authService.ts
import axiosInstance from '../api/axiosInstance';
import { Token } from '../types/auth';
import { Usuario } from '../types/usuario'; 
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

export const getMe = async (): Promise<Usuario> => {
    const response = await axiosInstance.get('/auth/me');
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
