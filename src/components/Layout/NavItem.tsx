// src/components/Layout/NavItem.tsx
import React from 'react';
import { Link, useMatch, useResolvedPath } from 'react-router-dom';

// Interfaz para definir la estructura de cada enlace de navegación
interface NavLinkProps {
    path?: string; // Opcional para los elementos padres que solo tienen sub-enlaces (no son directamente navegables)
    label: string;
    icon?: string; // Opcional para los sub-enlaces
    roles: string[]; // Roles necesarios para ver este enlace/menú
    subLinks?: NavLinkProps[]; // Definición recursiva para sub-menús anidados
    isSubItem?: boolean; // Bandera para aplicar estilos específicos a sub-elementos (sangría, tamaño de fuente)
    hasRole: (roleName: string) => boolean; // Función pasada desde Sidebar para verificar roles
}

const NavItem: React.FC<NavLinkProps> = ({ path, label, icon, roles, subLinks, isSubItem = false, hasRole }) => {

    const isAuthorized = roles.length === 0 || roles.some(role => hasRole(role));

    if (!isAuthorized) {
        return null; 
    }


    const resolvedPath = path ? useResolvedPath(path) : null;
    const isActive = resolvedPath ? useMatch({ path: resolvedPath.pathname, end: false }) : false;

    // Clases base aplicadas a todos los elementos de navegación
    const baseClasses = `flex items-center p-2 rounded transition-colors duration-200 text-base ${
        isSubItem ? 'ml-4 text-sm' : '' // Sangría y tamaño de fuente más pequeño para sub-elementos
    } ${isActive ? 'bg-gray-700 font-semibold' : 'hover:bg-gray-700'}`; // Color diferente para activo/hover

    // 3. Renderizado Condicional: Elemento Padre con Sub-enlaces vs. Enlace Directo
    if (subLinks && subLinks.length > 0) {
        // Este es un elemento padre que se expandirá al pasar el mouse
        return (
            // 'group' es una clase de Tailwind que permite aplicar estilos a los hijos cuando el padre tiene 'group-hover'
            <li className="relative group w-full mb-1">
                {/* El div actúa como el área clicable/hoverable del elemento padre */}
                <div className={`${baseClasses} cursor-pointer justify-between`}>
                    <div className="flex items-center">
                        {icon && <span className="mr-2" role="img" aria-label={label}>{icon}</span>}
                        <span>{label}</span>
                    </div>
                    {/* Icono de flecha que rota al pasar el mouse, indicando expansión */}
                    <span className="ml-auto transform transition-transform duration-200 group-hover:rotate-90">
                        ▶
                    </span>
                </div>
                {/* Lista anidada para los sub-enlaces, oculta por defecto, visible al pasar el mouse sobre el padre */}
                {/* 'pl-4' para sangría, 'mt-1' para espacio, 'hidden group-hover:block' para el efecto de despliegue */}
                <ul className="pl-4 mt-1 hidden group-hover:block">
                    {subLinks.map((subLink, index) => (
                        // Renderiza recursivamente los sub-enlaces usando el mismo componente NavItem
                        <NavItem key={index} {...subLink} isSubItem={true} hasRole={hasRole} />
                    ))}
                </ul>
            </li>
        );
    } else {
        // Este es un enlace directo (elemento hoja), no tiene sub-enlaces
        // Para enlaces directos, la coincidencia debe ser exacta ('end: true')
        const isExactActive = resolvedPath ? useMatch({ path: resolvedPath.pathname, end: true }) : false;
        const leafClasses = `flex items-center p-2 rounded transition-colors duration-200 text-base ${
            isSubItem ? 'ml-4 text-sm' : ''
        } ${isExactActive ? 'bg-gray-700 font-semibold' : 'hover:bg-gray-700'}`;

        return (
            <li className="w-full mb-1">
                {/* 'Link' de react-router-dom para navegación */}
                <Link to={path || '#'} className={leafClasses}>
                    {icon && <span className="mr-2" role="img" aria-label={label}>{icon}</span>}
                    <span>{label}</span>
                </Link>
            </li>
        );
    }
};

export default NavItem;
