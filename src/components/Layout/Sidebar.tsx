// src/components/Layout/Sidebar.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; // Para control de acceso por rol
import { IPersonaWithRoles } from '../../types/persona'; // Importa el tipo correcto

const Sidebar: React.FC = () => {
    const { user, loading } = useAuth(); // Obtenemos el usuario y el estado de carga

    // Si el usuario o los roles aún se están cargando, no renderizamos la barra lateral.
    if (loading) {
        return null;
    }

    // Si no hay usuario logeado después de la carga, no renderizamos la barra lateral.
    if (!user) {
        return null;
    }

    // Casteamos 'user.persona' a IPersonaWithRoles para que TypeScript sepa que 'roles' existe.
    const personaConRoles = user.persona as IPersonaWithRoles;

    // Helper para verificar si el usuario tiene un rol específico.
    const hasRole = (roleName: string): boolean => {
        const userRoles = personaConRoles.roles || [];
        return userRoles.some(rol => rol.nombre_rol === roleName);
    };

    // Define tus enlaces de navegación.
    const navLinks = [
        { path: '/dashboard', label: 'Resumen general', icon: '📊', roles: [] },
        { path: '/personas', label: 'Personas', icon: '🧑', roles: ['Administrador', 'Empleado'] },
        { path: '/usuarios', label: 'Usuarios', icon: '👥', roles: ['Administrador'] },
        { path: '/roles', label: 'Roles', icon: '🔑', roles: ['Administrador'] },
        { path: '/categorias', label: 'Categorias', icon: '📂', roles: ['Administrador'] },
        { path: '/productos', label: 'Productos', icon: '📦', roles: ['Administrador'] },
        { path: '/proveedores', label: 'Proveedores', icon: '🚚', roles: ['Administrador', 'Empleado'] },
        { path: '/compras', label: 'Compras', icon: '🛒', roles: ['Administrador', 'Empleado'] },
        { path: '/ventas', label: 'Ventas', icon: '💸', roles: ['Administrador', 'Empleado'] },
        { path: '/reportes', label: 'Reportes', icon: '📄', roles: ['Administrador', 'Empleado'] },
        { path: '/movimientos', label: 'movimientos', icon: '💸', roles: ['Administrador', 'Empleado'] },

    ];

    return (
        // Los estilos 'min-h-screen' y 'sticky top-0' harán que la sidebar ocupe toda la altura
        // y se "pegue" a la parte superior si el contenedor padre tiene scroll.
        // 'shrink-0' previene que se encoja en un flex container.
        <aside className="w-64 bg-gray-700 text-white p-4 shadow-md min-h-screen sticky top-0 shrink-0">
            <nav>
                <ul>
                    {navLinks.map((link) => {
                        const isAuthorized = link.roles.length === 0 || link.roles.some(role => hasRole(role));

                        if (isAuthorized) {
                            return (
                                <li key={link.path} className="mb-2">
                                    <Link
                                        to={link.path}
                                        className="flex items-center space-x-2 p-2 rounded hover:bg-gray-600 transition-colors"
                                    >
                                        <span role="img" aria-label={link.label}>{link.icon}</span>
                                        <span>{link.label}</span>
                                    </Link>
                                </li>
                            );
                        }
                        return null;
                    })}
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;