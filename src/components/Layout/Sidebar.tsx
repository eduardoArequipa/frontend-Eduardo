// src/components/Layout/Sidebar.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { IPersonaWithRoles } from '../../types/persona';
import {
    FiHome, FiUsers, FiUserCheck, FiKey, FiFolder, FiPackage, 
    FiTruck, FiShoppingCart, FiDollarSign, FiBarChart2, FiRepeat,
    FiChevronLeft, FiChevronRight
} from 'react-icons/fi';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const navLinks = [
    { path: '/dashboard', label: 'Resumen general', icon: FiHome, roles: [] },
    { path: '/personas', label: 'Personas', icon: FiUsers, roles: ['Administrador', 'Empleado'] },
    { path: '/usuarios', label: 'Usuarios', icon: FiUserCheck, roles: ['Administrador'] },
    { path: '/roles', label: 'Roles', icon: FiKey, roles: ['Administrador'] },
    { path: '/categorias', label: 'Categorías', icon: FiFolder, roles: ['Administrador'] },
    { path: '/productos', label: 'Productos', icon: FiPackage, roles: ['Administrador'] },
    { path: '/proveedores', label: 'Proveedores', icon: FiTruck, roles: ['Administrador', 'Empleado'] },
    { path: '/compras', label: 'Compras', icon: FiShoppingCart, roles: ['Administrador', 'Empleado'] },
    { path: '/ventas', label: 'Ventas', icon: FiDollarSign, roles: ['Administrador', 'Empleado'] },
    { path: '/reportes', label: 'Reportes', icon: FiBarChart2, roles: ['Administrador', 'Empleado'] },
    { path: '/movimientos', label: 'Movimientos', icon: FiRepeat, roles: ['Administrador', 'Empleado'] },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const { user, loading } = useAuth();
    const location = useLocation();
    const [isCollapsed, setCollapsed] = useState(false);

    if (loading || !user) {
        return null;
    }

    const personaConRoles = user.persona as IPersonaWithRoles;
    const hasRole = (roleName: string): boolean => {
        return personaConRoles.roles?.some(rol => rol.nombre_rol === roleName) ?? false;
    };

    const handleToggleCollapse = () => {
        setCollapsed(!isCollapsed);
    };

    const sidebarClasses = `
        bg-white dark:bg-gray-800 text-gray-800 dark:text-white
        flex flex-col
        h-screen
        p-4
        transition-all duration-300 ease-in-out
        shadow-lg md:shadow-none
        border-r border-gray-200 dark:border-gray-700
        fixed md:relative
        z-30
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
        ${isCollapsed ? 'w-20' : 'w-64'}
    `;

    return (
        <>
            {isOpen && <div className="fixed inset-0 bg-black opacity-50 z-20 md:hidden" onClick={onClose}></div>}

            <aside className={sidebarClasses}>
                <div className="flex-grow overflow-y-auto">
                    <nav>
                        <ul>
                            {navLinks.map((link) => {
                                const isAuthorized = link.roles.length === 0 || link.roles.some(role => hasRole(role));
                                const isActive = location.pathname === link.path;

                                if (isAuthorized) {
                                    return (
                                        <li key={link.path} className="mb-2">
                                            <Link
                                                to={link.path}
                                                onClick={onClose}
                                                className={`
                                                    flex items-center p-2 rounded-md transition-colors
                                                    ${isActive 
                                                        ? 'bg-indigo-600 text-white font-semibold' 
                                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }
                                                    ${isCollapsed ? 'justify-center' : 'space-x-3'}
                                                `}
                                            >
                                                <link.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
                                                <span className={`${isCollapsed ? 'hidden' : 'block'}`}>{link.label}</span>
                                            </Link>
                                        </li>
                                    );
                                }
                                return null;
                            })}
                        </ul>
                    </nav>
                </div>

                <div className="hidden md:block mt-4">
                    <button 
                        onClick={handleToggleCollapse}
                        className="w-full flex items-center justify-center p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
                    >
                        {isCollapsed ? <FiChevronRight className="h-6 w-6" /> : <FiChevronLeft className="h-6 w-6" />}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;