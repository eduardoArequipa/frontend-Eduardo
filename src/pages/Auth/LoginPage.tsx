// src/pages/Auth/LoginPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext'; // Importar el hook del tema

import '../../index.css';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, loading, error, isAuthenticated } = useAuth();
    const { theme } = useTheme(); // Obtener el tema actual
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loading) {
            await login(username, password);
        }
    };

    // Redirige si ya está autenticado - usando useEffect
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard'); // O a la ruta principal de la app
        }
    }, [isAuthenticated, navigate]);

    return (
        <div className={`min-h-screen flex ${theme}`}>
            {/* Columna Izquierda: Información e Imagen */}
            <div className="hidden lg:flex w-1/2 flex-col bg-gray-200 dark:bg-gray-800">
                <div className="h-3/5 w-full">
                    <img 
                        src="/images/comercial.jpg" 
                        alt="Imagen del comercial Don Eduardo" 
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="h-2/5 w-full flex flex-col justify-center p-10 text-gray-800 dark:text-gray-200">
                    <h1 className="text-3xl font-bold mb-3">Bienvenido al Sistema de Gestión Integral</h1>
                    <p className="text-md">
                        Esta es tu plataforma central para administrar el inventario, procesar ventas y acceder a reportes clave. Una herramienta diseñada para potenciar nuestro trabajo y facilitar la toma de decisiones.
                    </p>
                </div>
            </div>

            {/* Columna Derecha: Formulario de Login */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 sm:p-8">
                <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                    <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
                        Acceso al Sistema
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Usuario
                            </label>
                            <Input
                                id="username"
                                name="username"
                                type="text"
                                required
                                placeholder="Ingrese su usuario"
                                value={username}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Contraseña
                            </label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    placeholder="Ingrese su contraseña"
                                    value={password}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

                        <div>
                            <Button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-2.5 px-4 rounded-md text-white font-semibold ${loading ? 'bg-indigo-400 dark:bg-indigo-700 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors duration-300`}
                            >
                                {loading ? <LoadingSpinner /> : 'Iniciar Sesión'}
                            </Button>
                        </div>
                    </form>

                    <div className="text-center text-sm">
                        <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline">
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
