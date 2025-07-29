import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const AdminRoute: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

   // Esperar a que el estado de autenticación se cargue
   if (loading) {
    return <div>Cargando...</div>; // O un spinner real
   }

  // Si no está autenticado, redirige al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }


  return <Outlet />;
};

export default AdminRoute;