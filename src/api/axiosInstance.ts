// src/api/axiosInstance.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'; // Tu URL de backend

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    responseType: 'json', // <--- ¡AÑADIDO AQUÍ!
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken'); // Lee el token del almacenamiento
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`; // Añade la cabecera Authorization
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Opcional pero recomendado: Interceptor para manejar respuestas 401 (No autorizado)
// Esto es útil para redirigir automáticamente al login si el token expira o no es válido
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Añadimos una condición para que no actúe en la página de login
        const originalRequest = error.config;
        if (error.response && error.response.status === 401 && originalRequest.url !== '/auth/login') {
            console.error("Authentication error (401). Redirecting to login.");
            // Limpia el token y redirige. Asegúrate de que esta lógica no cause bucles.
            localStorage.removeItem('accessToken');
            // Opcional: redirigir al usuario
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);


export default axiosInstance;