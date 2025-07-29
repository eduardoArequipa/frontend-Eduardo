// src/components/Layout/Navbar.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import UserAvatar from '../Specific/UserAvatar';
import Button from '../Common/Button';
// Importa IPersonaWithRoles para usar el tipo correcto
import { IPersonaWithRoles } from '../../types/persona'; // Asegúrate de que la ruta sea correcta

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const Navbar: React.FC = () => {
    const { user, logout, loading } = useAuth();

    // ➡️ Estado de Carga: Si los datos del usuario se están cargando, muestra un mensaje.
    if (loading) {
        return (
            <nav className="bg-gray-800 text-white p-4 shadow-md">
                <div className="container mx-auto flex justify-between items-center">
                    <Link to="/dashboard" className="text-xl font-bold text-white hover:text-gray-300 transition-colors">SICDE</Link>
                    <span className="text-sm text-gray-400">Cargando...</span>
                </div>
            </nav>
        );
    }

    // ➡️ Usuario No Autenticado: Si no hay usuario después de la carga, muestra el botón de login.
    if (!user) {
        return (
            <nav className="bg-gray-800 text-white p-4 shadow-md">
                <div className="container mx-auto flex justify-between items-center">
                    <Link to="/dashboard" className="text-xl font-bold text-white hover:text-gray-300 transition-colors">SICDE</Link>
                    <Link
                        to="/login"
                        className="text-white px-4 py-2 rounded-md text-sm font-medium bg-indigo-600 hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                    >
                        Iniciar Sesión
                    </Link>
                </div>
            </nav>
        );
    }

    // ➡️ Usuario Autenticado: Lógica para mostrar la información del usuario.
    // 🚨🚨🚨 CAMBIO CLAVE AQUÍ: Castear user.persona a IPersonaWithRoles 🚨🚨🚨
    // Esto le dice a TypeScript que 'user.persona' tiene la propiedad 'roles'.
    const personaConRoles = user.persona as IPersonaWithRoles;

    // Construcción del nombre completo del usuario de forma segura
    const userName = `${personaConRoles.nombre ?? ''} ${personaConRoles.apellido_paterno ?? ''} ${personaConRoles.apellido_materno ?? ''}`.trim();

    // Extracción y formateo de roles
    // Ahora podemos acceder a personaConRoles.roles sin error de TypeScript
    const userRoles = personaConRoles.roles
        ?.map(rol => rol.nombre_rol)
        .join(', ') || 'Rol no asignado';

    // Manejo de la URL de la foto de perfil
    const userPhotoUrl = (user.foto_ruta && user.foto_ruta.startsWith('/'))
        ? `${BACKEND_BASE_URL}${user.foto_ruta}`
        : '/images/default-user-avatar.png'; // Ruta a tu imagen de avatar por defecto

    return (
        <nav className="bg-gray-800 text-white p-4 shadow-md z-10 relative">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/dashboard" className="text-xl font-bold text-white hover:text-gray-300 transition-colors">SICDE</Link>

                <div className="flex items-center space-x-4">
                    {/* Información del usuario logeado */}
                    <div className="flex items-center space-x-3">
                        <UserAvatar src={userPhotoUrl} alt={`${userName}'s avatar`} />
                        <div>
                            <p className="text-sm font-semibold">{userName || 'Usuario'}</p>
                            <p className="text-xs text-gray-400">{userRoles}</p>
                        </div>
                    </div>
                    {/* Botón de cerrar sesión */}
                    <Button
                        onClick={logout}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                    >
                        Cerrar Sesión
                    </Button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;