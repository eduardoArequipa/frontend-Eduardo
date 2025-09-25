// src/components/Layout/Sidebar.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { IMenuWithRoles } from '../../types/menu';
import { FiHome, FiUsers, FiUserCheck, FiKey, FiFolder, FiPackage, FiTruck, FiShoppingCart, FiDollarSign, FiBarChart2, FiRepeat, FiChevronLeft, FiChevronRight, FiTag, FiShield } from 'react-icons/fi';

// Mapeo de rutas a iconos
const iconMap: { [key: string]: React.ElementType } = {
    '/dashboard': FiHome,
    '/personas': FiUsers,
    '/usuarios': FiUserCheck,
    '/roles': FiKey,
    '/categorias': FiFolder,
    '/productos': FiPackage,
    '/proveedores': FiTruck,
    '/compras': FiShoppingCart,
    '/ventas': FiDollarSign,
    '/reportes': FiBarChart2,
    '/movimientos': FiRepeat,
    '/marcas': FiTag,
    '/audit-logs': FiShield,
};

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const { user, filteredMenus, activeRole, loading } = useAuth(); // Usar menús filtrados por rol activo
    const location = useLocation();
    const [isCollapsed, setCollapsed] = useState(false);

    if (loading || !user) {
        return null;
    }

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
                {/* Indicador de Rol Activo */}
                {activeRole && !isCollapsed && (
                    <div className="mb-4 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                                {activeRole}
                            </span>
                        </div>
                    </div>
                )}

                <div className="flex-grow overflow-y-auto">
                    <nav>
                        <ul>
                            {/* Usar menús filtrados por rol activo */}
                            {filteredMenus.map((menu: IMenuWithRoles) => {
                                const Icon = iconMap[menu.ruta] || FiFolder;
                                const isActive = location.pathname.startsWith(menu.ruta);

                                return (
                                    <li key={menu.menu_id} className="mb-2">
                                        <Link
                                            to={menu.ruta}
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
                                            <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
                                            <span className={`${isCollapsed ? 'hidden' : 'block'}`}>{menu.nombre}</span>
                                        </Link>
                                    </li>
                                );
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