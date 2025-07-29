// src/pages/Auth/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { IPersonaWithRoles } from '../../types/persona'; // ¡Importante para los roles!

interface ProtectedRouteProps {
    allowedRoles?: string[]; // Define la prop para los roles permitidos
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
    const { isAuthenticated, user, loading } = useAuth();

    // Muestra un indicador de carga mientras se verifica la sesión
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen text-lg text-gray-700 bg-gray-50">
                Verificando sesión...
            </div>
        );
    }

    // Si no está autenticado, redirige al login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Si la ruta requiere roles específicos, verifica si el usuario tiene alguno
    if (allowedRoles && allowedRoles.length > 0) {
        // En este punto, `user` no es null y `user.persona` debería tener `roles` debido a cómo tipificamos `useAuth`.
        const userPersona = user!.persona as IPersonaWithRoles; // Usamos '!' para asegurar que no es null y 'as' para el tipo de roles
        const userRoles = userPersona.roles?.map(rol => rol.nombre_rol) || [];

        // Comprueba si el usuario tiene al menos uno de los roles permitidos
        const isAuthorized = allowedRoles.some(role => userRoles.includes(role));

        // Si no está autorizado, redirige al dashboard (o a una página de acceso denegado)
        if (!isAuthorized) {
            return <Navigate to="/dashboard" replace />;
        }
    }

    // Si está autenticado y autorizado, renderiza el contenido de la ruta anidada
    return <Outlet />;
};

export default ProtectedRoute;