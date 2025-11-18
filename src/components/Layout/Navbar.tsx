// src/components/Layout/Navbar.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ThemeToggleButton from '../Common/ThemeToggleButton';
import UserDropdown from '../Common/UserDropdown';
import { FiMenu } from 'react-icons/fi';

interface NavbarProps {
    onMenuButtonClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuButtonClick }) => {
    const { user, loading } = useAuth();

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

        return <UserDropdown />;
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
                        Sistema Integral Comercial Don Eduardo
                    </Link>
                </div>

                <div className="flex items-center space-x-4">
                    <ThemeToggleButton /> 
                    {renderUserContent()}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;