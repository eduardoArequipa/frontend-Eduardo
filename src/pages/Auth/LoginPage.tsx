// src/pages/Auth/LoginPage.tsx
import React, { useState, useEffect } from 'react';
import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom'; 

import '../../index.css'; 

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login, loading, error, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loading) {
            await login(username, password);
        }
    };

    if (isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen flex">
            {/* Columna Izquierda: Información del Comercial */}
            <div className="w-1/2 bg-cover bg-center text-white p-10 flex flex-col justify-center" style={{ backgroundImage: "url('/images/comercial.jpg')" }}>
                <div className="bg-black bg-opacity-50 p-8 rounded-xl">
                    <h1 className="text-4xl font-bold mb-4">Comercial Don Eduardo</h1>
                    <p className="text-lg">
                        Somos u comercial comprometida con la calidad y el servicio. Nos especializamos en ofrecer productos de primera necesidad, atención personalizada y gestión eficiente de inventario y ventas.
                    </p>
                    <p className="mt-4 text-sm text-gray-300">
                          Nuestro sistema digital está diseñado para facilitar tus tareas diarias con rapidez, seguridad y modernidad.
                    </p>
                </div>
            </div>

            {/* Columna Derecha: Login */}
            <div className="w-1/2 flex items-center justify-center bg-white">
                <div className="w-full max-w-md p-10 ">
                    <h2 className="text-3xl font-semibold text-center text-gray-800 mb-6">Acceso al Sistema</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                            <Input
                                id="username"
                                name="username"
                                type="text"
                                required
                                placeholder="Ingrese su usuario"
                                value={username}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                placeholder="Ingrese su contraseña"
                                value={password}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
<div>

</div>
                        <div>
                            <Button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-2 px-4 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {loading ? <LoadingSpinner /> : 'Iniciar sesión'}
                            </Button>
                        </div>
                    </form>

                    {/* --- AÑADE ESTE BLOQUE AQUÍ, FUERA DEL FORMULARIO PERO DENTRO DE LA SECCIÓN DE LOGIN --- */}
                    <div className="mt-4 text-center text-sm"> {/* Ajuste de margen y tamaño de texto */}
                        <p className="text-gray-600 mb-1">
                            <Link to="/forgot-password" className="text-indigo-600 hover:text-indigo-800 hover:underline">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </p>
                        <p className="text-gray-600">
                            ¿Ya tienes un código de recuperación?{' '}
                            <Link to="/reset-password" className="text-indigo-600 hover:text-indigo-800 hover:underline">
                                Restablecer contraseña aquí
                            </Link>
                        </p>
                    </div>
                    {/* --- FIN DEL BLOQUE A AÑADIR --- */}

                </div>
            </div>
        </div>
    );
};

export default LoginPage;