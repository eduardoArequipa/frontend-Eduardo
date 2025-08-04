// src/components/Layout/Navbar.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import UserAvatar from '../Specific/UserAvatar';
import Button from '../Common/Button';
import ThemeToggleButton from '../Common/ThemeToggleButton'; // Importa el botón de tema
import { IPersonaWithRoles } from '../../types/persona';
import { FiMenu } from 'react-icons/fi';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

interface NavbarProps {
    onMenuButtonClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuButtonClick }) => {
    const { user, logout, loading } = useAuth();

    const renderUserContent = () => {
        if (loading) {
            return <span className="text-sm text-gray-400">Cargando...</span>;
        }

        if (!user) {
            return (
                <Link
                    to="/login"
                    className="text-white px-4 py-2 rounded-md text-sm font-medium bg-indigo-600 hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                >
                    Iniciar Sesión
                </Link>
            );
        }

        const personaConRoles = user.persona as IPersonaWithRoles;
        const userName = `${personaConRoles.nombre ?? ''} ${personaConRoles.apellido_paterno ?? ''}`.trim();
        const userRoles = personaConRoles.roles?.map(rol => rol.nombre_rol).join(', ') || 'Rol no asignado';
        const userPhotoUrl = user.foto_ruta ? `${BACKEND_BASE_URL}${user.foto_ruta}` : '/images/default-user-avatar.png';

        return (
            <div className="flex items-center space-x-4">
                <div className="hidden md:flex items-center space-x-3">
                    <UserAvatar src={userPhotoUrl} alt={`${userName}'s avatar`} />
                    <div>
                        <p className="text-sm font-semibold">{userName || 'Usuario'}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{userRoles}</p>
                    </div>
                </div>
                <Button
                    onClick={logout}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                >
                    Cerrar Sesión
                </Button>
            </div>
        );
    };

    return (
        <nav className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-md z-10 relative">
            <div className="container mx-auto flex justify-between items-center p-4">
                <div className="flex items-center space-x-4">
                    <button 
                        onClick={onMenuButtonClick}
                        className="md:hidden p-2 rounded-md text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Abrir menú"
                    >
                        <FiMenu className="h-6 w-6" />
                    </button>
                    <Link to="/dashboard" className="text-xl font-bold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        SICDE
                    </Link>
                </div>

                <div className="flex items-center space-x-4">
                    <ThemeToggleButton /> {/* Botón de modo oscuro añadido aquí */}
                    {renderUserContent()}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;