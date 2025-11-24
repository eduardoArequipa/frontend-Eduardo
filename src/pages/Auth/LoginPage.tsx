// src/pages/Auth/LoginPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaUser, FaLock } from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import Button from '../../components/Common/Button';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';

// Definir el esquema de validación con Zod
const loginSchema = z.object({
    username: z.string().min(1, 'El usuario es requerido'),
    password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
    const [showPassword, setShowPassword] = useState(false);
    const { login, loading, error } = useAuth();
    const { theme } = useTheme();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormInputs>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormInputs) => {
        if (!loading) {
            await login(data.username, data.password);
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors duration-300 relative overflow-hidden`}>
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-3xl animate-fade-in"></div>
                <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-3xl animate-fade-in" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] bg-blue-500/20 rounded-full blur-3xl animate-fade-in" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 p-4 sm:p-8 z-10">
                
                {/* Columna Izquierda: Imagen y Bienvenida (Visible en LG) */}
                <div className="hidden lg:flex flex-col justify-center relative rounded-3xl overflow-hidden shadow-2xl animate-slide-up">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/90 to-purple-700/90 z-10 mix-blend-multiply"></div>
                    <img 
                        src="/images/comercial.jpg" 
                        alt="Comercial Don Eduardo" 
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="relative z-20 p-12 text-white flex flex-col justify-between h-full">
                        <div>
                            <h1 className="text-4xl font-extrabold mb-4 tracking-tight">
                                Comercial <br/>
                                <span className="text-indigo-200">Don Eduardo</span>
                            </h1>
                            <div className="w-20 h-1 bg-indigo-400 rounded-full mb-6"></div>
                        </div>
                        
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold">Gestión Integral Inteligente</h2>
                            <p className="text-lg text-indigo-100 leading-relaxed">
                                Optimiza tu inventario, agiliza tus ventas y toma decisiones basadas en datos reales. 
                                Tu plataforma centralizada para el éxito comercial.
                            </p>
                            <div className="flex items-center space-x-4 pt-4">
                                <div className="flex -space-x-2">
                                    {[1,2,3].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-indigo-400/30 border-2 border-indigo-600 flex items-center justify-center text-xs font-bold">
                                            <FaUser />
                                        </div>
                                    ))}
                                </div>
                                <span className="text-sm font-medium text-indigo-200">Equipo conectado</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Formulario */}
                <div className="flex items-center justify-center">
                    <div className="w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-xl border border-white/20 dark:border-gray-700 animate-slide-up-delay-1">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Bienvenido de nuevo</h2>
                            <p className="text-gray-500 dark:text-gray-400">Ingresa tus credenciales para acceder</p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Usuario
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                        <FaUser />
                                    </div>
                                    <input
                                        id="username"
                                        type="text"
                                        {...register('username')}
                                        className={`w-full !pl-16 pr-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:focus:bg-gray-700 transition-all duration-200 ${errors.username ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-200 dark:border-gray-600'}`}
                                        placeholder="ej. admin"
                                        autoComplete="username"
                                    />
                                </div>
                                {errors.username && (
                                    <p className="text-red-500 text-xs mt-1 ml-1">{errors.username.message}</p>
                                )}
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Contraseña
                                    </label>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                        <FaLock />
                                    </div>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        {...register('password')}
                                        className={`w-full !pl-16 pr-12 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:focus:bg-gray-700 transition-all duration-200 ${errors.password ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-200 dark:border-gray-600'}`}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors focus:outline-none"
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-red-500 text-xs mt-1 ml-1">{errors.password.message}</p>
                                )}
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 animate-fade-in">
                                    <p className="text-red-600 dark:text-red-400 text-sm text-center font-medium">
                                        {typeof error === 'string' ? error : 'Credenciales incorrectas o error de conexión'}
                                    </p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3.5 rounded-xl text-white font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 transform hover:-translate-y-0.5 transition-all duration-200 ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'}`}
                            >
                                {loading ? <LoadingSpinner /> : 'Iniciar Sesión'}
                            </Button>
                        </form>

                        <div className="mt-8 text-center">
                             <Link to="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
