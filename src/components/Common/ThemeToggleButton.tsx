
// src/components/Common/ThemeToggleButton.tsx
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';

const ThemeToggleButton: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            aria-label={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
            title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
        >
            {theme === 'light' ? (
                <FiMoon className="h-5 w-5 text-gray-700 hover:text-indigo-600 transition-colors" />
            ) : (
                <FiSun className="h-5 w-5 text-yellow-400 hover:text-yellow-300 transition-colors" />
            )}
        </button>
    );
};

export default ThemeToggleButton;
