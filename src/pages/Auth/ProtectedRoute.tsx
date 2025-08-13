// src/pages/Auth/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
    requiredMenu?: string; // La URL base del menú requerido para acceder
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredMenu }) => {
    const { isAuthenticated, loading, menus } = useAuth();

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

    // Si la ruta requiere un menú específico, verificamos si el usuario tiene acceso a él.
    if (requiredMenu) {
        // `menus` es la lista de menús permitidos para el usuario desde AuthContext.
        const hasAccess = menus.some(menu => menu.ruta === requiredMenu);

        // Si no tiene acceso, redirige al dashboard.
        if (!hasAccess) {
            return <Navigate to="/home" replace />;
        }
    }

    // Si está autenticado y (si se requiere) tiene acceso, renderiza el contenido.
    return <Outlet />;
};

export default ProtectedRoute;