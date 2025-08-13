import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FiUser, FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

const HomePage: React.FC = () => {
    const { user } = useAuth();
    const { theme } = useTheme();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 18) return 'Buenas tardes';
        return 'Buenas noches';
    };

    return (
        <div className={`flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-4 text-center transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
            <div className="max-w-2xl w-full bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-8 transform transition-all hover:scale-105 duration-500">
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-indigo-100 dark:bg-indigo-900 rounded-full">
                        <FiUser className="h-12 w-12 text-indigo-600 dark:text-indigo-300" />
                    </div>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    {getGreeting()}, {user?.persona?.nombre || 'Usuario'}!
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                    Te damos la bienvenida al sistema.
                </p>
                <div className="text-base text-gray-500 dark:text-gray-400">
                    <p>Desde aquí podrás acceder a todas las funcionalidades que necesitas para tu trabajo diario.</p>
                    <p className="mt-2">Utiliza el menú lateral para navegar por los diferentes módulos.</p>
                </div>
                <div className="mt-8 flex justify-center">
                    {theme === 'dark' ? 
                        <FiSun className="h-8 w-8 text-yellow-400 animate-pulse" /> : 
                        <FiMoon className="h-8 w-8 text-gray-700 animate-pulse" />
                    }
                </div>
            </div>
        </div>
    );
};

export default HomePage;
